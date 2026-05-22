// Test activity log middleware logic
const testPath = '/api/v1/contributions/tontine/1/bulk';
console.log('Testing with path:', testPath);

const pathParts = testPath.split('/').filter(p => p);
console.log('pathParts:', pathParts);

let entityType = 'unknown';
let entityId = null;

if (pathParts.length >= 3) {
  entityType = pathParts[2];
  console.log('entityType set to:', entityType);
  
  for (let i = 3; i < pathParts.length; i++) {
    if (!isNaN(pathParts[i])) {
      entityId = parseInt(pathParts[i]);
      console.log('entityId set to:', entityId);
      break;
    }
  }
}

// Check for bulk actions
const hasBulkAction = pathParts.some(p => p.includes('bulk') || p.includes('record'));

let actionDescription = 'POST request';
if (hasBulkAction) {
  actionDescription = `Recorded bulk ${entityType}`;
}

console.log('\n=== Final Results ===');
console.log('entity_type:', entityType);
console.log('entity_id:', entityId);
console.log('action_description:', actionDescription);
