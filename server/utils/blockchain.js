import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Dynamic chain path generator
const getChainPath = (reportType) => {
  return path.join('block_storage', `${reportType.toLowerCase()}_chain.json`);
};

// Helper to get last block for a specific report_id
export const getLastBlock = (reportType, report_id) => {
  const chainPath = getChainPath(reportType);
  if (!fs.existsSync(chainPath)) return null;
  const chain = JSON.parse(fs.readFileSync(chainPath, 'utf8') || '[]');

  const filtered = chain.filter(b => b.data.report_id === report_id);
  return filtered.length > 0 ? filtered[filtered.length - 1] : null;
};

// Helper to create a new block structure (not inserting, just generating block object)
export const createBlock = (reportType, data) => {
  const { report_id, user_id, title, report_type, keywords, file_path, status } = data;

  const prevBlock = getLastBlock(reportType, report_id);
  const index = prevBlock ? prevBlock.index + 1 : 0;
  const previousHash = prevBlock ? prevBlock.hash : '0';

  const timestamp = new Date().toISOString();
  const blockData = {
    index,
    timestamp,
    report_id,
    user_id,
    title,
    report_type,
    keywords,
    file_path,
    status,
    previousHash,
  };

  const computedHash = crypto.createHash('sha256').update(JSON.stringify(blockData)).digest('hex');
  return { ...blockData, hash: computedHash };
};
