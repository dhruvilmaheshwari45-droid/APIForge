import MockServer from '../models/MockServer.js';
import MockRule from '../models/MockRule.js';

export const matchMockRule = async (serverId, requestContext) => {
  const { method, path, query = {}, headers = {}, auth, body } = requestContext;

  const server = await MockServer.findOne({
    $or: [{ customId: serverId }, { _id: serverId.match(/^[0-9a-fA-F]{24}$/) ? serverId : null }],
  });

  if (!server || server.status !== 'active') {
    return null;
  }

  const sId = server.customId || server._id.toString();
  const rules = await MockRule.find({ serverId: sId, enabled: true }).sort({ priority: 1 });

  for (const rule of rules) {
    let allConditionsMatch = true;

    for (const cond of (rule.conditions || []).filter((c) => c.enabled)) {
      let subjectValue = '';

      switch (cond.type) {
        case 'method':
          subjectValue = (method || '').toUpperCase();
          break;
        case 'path':
          subjectValue = path || '';
          break;
        case 'param':
          subjectValue = query[cond.field] || '';
          break;
        case 'header':
          subjectValue = headers[cond.field.toLowerCase()] || '';
          break;
        case 'auth':
          subjectValue = auth ? 'present' : 'absent';
          break;
        case 'body':
          if (typeof body === 'object' && body !== null) {
            subjectValue = String(body[cond.field] || '');
          } else {
            subjectValue = String(body || '');
          }
          break;
        default:
          subjectValue = '';
      }

      let matches = false;
      const targetVal = String(cond.value || '').toLowerCase();
      const actualVal = String(subjectValue || '').toLowerCase();

      switch (cond.operator) {
        case 'equals':
          matches = actualVal === targetVal;
          break;
        case 'not_equals':
          matches = actualVal !== targetVal;
          break;
        case 'contains':
          matches = actualVal.includes(targetVal);
          break;
        case 'exists':
          matches = subjectValue !== '' && subjectValue !== undefined && subjectValue !== null;
          break;
        case 'not_exists':
          matches = subjectValue === '' || subjectValue === undefined || subjectValue === null;
          break;
        default:
          matches = false;
      }

      if (!matches) {
        allConditionsMatch = false;
        break;
      }
    }

    if (allConditionsMatch) {
      return {
        matched: true,
        rule,
        response: rule.response,
        delayMs: rule.response.delayMs || server.defaultLatencyMs || 0,
      };
    }
  }

  return null;
};

export default {
  matchMockRule,
};
