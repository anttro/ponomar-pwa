/**
 * Convert service template XML to JSON.
 * Recursively converts all subdirectories under Services/.
 * Unwraps COMMONPRAYER root wrappers, flattens children, lowercases attributes.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: false,
  trimValues: true,
  preserveOrder: true,
});

function parseFile(path: string): unknown[] | null {
  if (!existsSync(path)) return null;
  const xml = readFileSync(path, 'utf-8');
  try {
    return parser.parse(xml) as unknown[];
  } catch {
    return null;
  }
}

/**
 * Lowercase all @_-prefixed attribute keys and strip the prefix.
 * e.g. { '@_Value': 'Wisdom.', '@_Who': 'Deacon' } → { value: 'Wisdom.', who: 'Deacon' }
 */
function lowerAttrs(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('@_')) {
      result[key.slice(2).toLowerCase()] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Convert a parsed XML node (preserveOrder format) into a flat array of service nodes.
 * Input is an array of ordered entries, each: { tagName: children[], ":@": { attrs } }
 */
function convertNodes(data: unknown[]): unknown[] {
  const result: unknown[] = [];

  for (const entry of data as Record<string, unknown>[]) {
    // Get the tag name (first key that isn't ':@')
    const tagName = Object.keys(entry).find(k => k !== ':@');
    if (!tagName) continue;

    const attrs = (entry[':@'] ?? {}) as Record<string, unknown>;
    const children = (entry[tagName] ?? []) as unknown[];

    // Unwrap wrapper elements (COMMONPRAYER, SERVICES, SERVICE)
    if (tagName === 'COMMONPRAYER' || tagName === 'SERVICE' || tagName === 'SERVICES') {
      result.push(...convertNodes(children));
      continue;
    }

    // Convert element with its attributes
    const node = convertNodeItem(tagName, attrs, children);
    if (node) result.push(node);
  }

  return result;
}

/**
 * Convert a single XML element into a service node object.
 */
function convertNodeItem(
  tagName: string,
  attrs: Record<string, unknown>,
  children: unknown[]
): Record<string, unknown> | null {
  const lowercased = lowerAttrs(attrs);

  // Convert boolean attribute values: "1"→true, "0"→false
  const boolKeys = ['redfirst', 'newline', 'header', 'null', 'withmen'];
  for (const k of boolKeys) {
    if (lowercased[k] === '1') lowercased[k] = true;
    else if (lowercased[k] === '0') lowercased[k] = false;
  }
  // Convert numeric attribute values: "3"→3
  const numKeys = ['times'];
  for (const k of numKeys) {
    if (typeof lowercased[k] === 'string' && /^\d+$/.test(lowercased[k])) {
      lowercased[k] = parseInt(lowercased[k], 10);
    }
  }
  const node: Record<string, unknown> = { type: tagName };

  // Copy all attributes as lowercase keys
  for (const [key, value] of Object.entries(lowercased)) {
    if (key === 'type') continue;
    node[key] = value;
  }

  // Process child elements recursively
  if (children.length > 0) {
    // Check for #text content
    const textNode = children.find(c => (c as Record<string, unknown>)['#text']);
    if (textNode) {
      node.text = (textNode as Record<string, unknown>)['#text'] as string;
    } else {
      const childNodes = convertNodes(children);
      if (childNodes.length > 0) {
        node._children = childNodes;
      }
    }
  }

  return node;
}

function convertDirRecursive(srcDir: string, outDir: string): number {
  let count = 0;
  mkdirSync(outDir, { recursive: true });

  const entries = readdirSync(srcDir);
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const srcPath = join(srcDir, entry);

    if (!existsSync(srcPath)) continue;

    if (entry.endsWith('.xml')) {
      const data = parseFile(srcPath);
      if (!data) continue;

      // Convert and flatten
      const nodes = flattenNodes(convertNodes(data));
      const outName = entry.replace('.xml', '.json');
      writeFileSync(join(outDir, outName), JSON.stringify(nodes));
      count++;
    } else {
      // Subdirectory (e.g. "Tone 1", "KONTAKION", "TROPARION")
      const subOut = join(outDir, entry);
      count += convertDirRecursive(srcPath, subOut);
    }
  }

  return count;
}

/**
 * Flatten nodes that have _children into a single flat array.
 */
function flattenNodes(nodes: unknown[]): unknown[] {
  const result: unknown[] = [];
  for (const node of nodes) {
    if (typeof node !== 'object' || node === null) {
      result.push(node);
      continue;
    }
    const n = node as Record<string, unknown>;
    if (n._children && Array.isArray(n._children)) {
      // This node has children — push the node itself (without _children) then flatten children
      const { _children, ...rest } = n;
      result.push(rest);
      result.push(...flattenNodes(_children));
    } else {
      result.push(n);
    }
  }
  return result;
}

export async function convertServices(SRC: string, OUT: string) {
  console.log('Converting service templates...');

  const SERVICE_SOURCES = [
    { id: 'en', prefix: 'en' },
    { id: 'cu', prefix: 'cu' },
    { id: 'ru', prefix: 'cu/ru' },
    { id: 'el', prefix: 'el' },
    { id: 'fr', prefix: 'fr' },
    { id: 'zh/Hans', prefix: 'zh/Hans' },
    { id: 'zh/Hant', prefix: 'zh/Hant' },
    { id: 'zh', prefix: 'zh' },
    { id: 'shared', prefix: '' },
  ];

  for (const { id, prefix } of SERVICE_SOURCES) {
    const servicesDir = join(SRC, 'languages', prefix, 'xml', 'Services');
    if (!existsSync(servicesDir)) continue;

    const outDir = join(OUT, id, 'services');
    const count = convertDirRecursive(servicesDir, outDir);
    console.log(`  ${id}: ${count} service files`);
  }
}
