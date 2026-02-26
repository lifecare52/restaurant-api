import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '../src/modules');
const OUTPUT_FILE = path.join(__dirname, '../DATABASE_ERD.md');

interface FieldInfo {
    name: string;
    type: string;
    required: boolean;
    ref?: string;
}

interface ModelInfo {
    modelName: string;
    fields: FieldInfo[];
}

function findModelFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findModelFiles(filePath, fileList);
        } else if (file.endsWith('.model.ts')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function extractModelName(content: string): string | null {
    // Matches: model<T, M>('ModelName', ...) or model<T>('ModelName', ...)
    const match = content.match(/model\s*(?:<[^>]+>)?\s*\(\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
}

function parseSchemaFields(content: string): FieldInfo[] {
    const fields: FieldInfo[] = [];

    // Find the Schema block: new Schema<T>({ ... }, ...)
    // We'll manually extract key lines from the schema body
    const schemaMatch = content.match(/new Schema\s*(?:<[^>]+>)?\s*\(\s*\{([\s\S]*?)\},\s*\{/);
    if (!schemaMatch) return fields;

    const schemaBody = schemaMatch[1];

    // Split by lines and parse each property
    const lines = schemaBody.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//')) continue;

        // Match a field like:  fieldName: { type: Schema.Types.ObjectId, ... }
        // or:                  fieldName: { type: String, ... }
        const fieldMatch = line.match(/^(\w+)\s*:\s*\{(.*)$/);
        if (!fieldMatch) continue;

        const fieldName = fieldMatch[1];
        if (fieldName === 'timestamps') continue;

        // Collect multi-line field definition
        let fieldDef = fieldMatch[2];
        let braceDepth = (fieldDef.match(/{/g) || []).length - (fieldDef.match(/}/g) || []).length + 1;
        let j = i + 1;
        while (braceDepth > 0 && j < lines.length) {
            const nextLine = lines[j].trim();
            fieldDef += ' ' + nextLine;
            braceDepth += (nextLine.match(/{/g) || []).length;
            braceDepth -= (nextLine.match(/}/g) || []).length;
            j++;
        }

        // Extract type
        let typeName = 'Mixed';
        const typeMatch = fieldDef.match(/type\s*:\s*([^,}\]]+)/);
        if (typeMatch) {
            const rawType = typeMatch[1].trim();
            if (rawType.includes('ObjectId')) typeName = 'ObjectId';
            else if (rawType === 'String') typeName = 'String';
            else if (rawType === 'Number') typeName = 'Number';
            else if (rawType === 'Boolean') typeName = 'Boolean';
            else if (rawType === 'Date') typeName = 'Date';
            else if (rawType.startsWith('[')) typeName = 'Array';
            else typeName = rawType.replace(/Schema\.Types\./g, '');
        }

        // Check if nested schema (sub-document, no 'type' keyword directly)
        if (!typeMatch && fieldDef.includes('{')) {
            typeName = 'Object';
        }

        // Extract required
        const required = /required\s*:\s*true/.test(fieldDef);

        // Extract ref
        let ref: string | undefined;
        const refMatch = fieldDef.match(/ref\s*:\s*['"]([^'"]+)['"]/);
        if (refMatch) ref = refMatch[1];

        // If ObjectId and no ref, it might still be a reference (check field name)
        fields.push({ name: fieldName, type: typeName, required, ref });
    }

    // Also handle _id, createdAt, updatedAt
    fields.unshift({ name: '_id', type: 'ObjectId', required: true });
    if (/timestamps\s*:\s*true/.test(content)) {
        fields.push({ name: 'createdAt', type: 'Date', required: false });
        fields.push({ name: 'updatedAt', type: 'Date', required: false });
    }

    return fields;
}

function generateMermaidERD(models: ModelInfo[]): string {
    const relations: string[] = [];
    let lines: string[] = [];

    lines.push('# 🗃️ Database ERD (Entity Relationship Diagram)');
    lines.push('');
    lines.push('> Auto-generated from Mongoose model schemas');
    lines.push('');
    lines.push('```mermaid');
    lines.push('erDiagram');

    for (const model of models) {
        lines.push(`  ${model.modelName} {`);
        for (const field of model.fields) {
            const required = field.required ? 'PK' : '';
            const sanitizedName = field.name.replace(/[^a-zA-Z0-9_]/g, '_');
            lines.push(`    ${field.type} ${sanitizedName}${required ? ' "' + required + '"' : ''}`);
            if (field.ref) {
                relations.push(`  ${model.modelName} }o--|| ${field.ref} : "${field.name}"`);
            }
        }
        lines.push(`  }`);
        lines.push('');
    }

    // Deduplicate relations
    const uniqueRelations = [...new Set(relations)];
    for (const rel of uniqueRelations) {
        lines.push(rel);
    }

    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');

    // Summary table
    lines.push('## 📋 Collections Summary');
    lines.push('');
    lines.push('| Collection | Fields Count | References |');
    lines.push('|------------|-------------|------------|');
    for (const model of models) {
        const refs = model.fields.filter(f => f.ref).map(f => `${f.name} → ${f.ref}`).join(', ');
        lines.push(`| **${model.modelName}** | ${model.fields.length} | ${refs || '-'} |`);
    }

    return lines.join('\n');
}

function main() {
    console.log('🔍 Searching for Mongoose model files...\n');
    const modelFiles = findModelFiles(SRC_DIR);

    if (modelFiles.length === 0) {
        console.error('❌ No model files found in: ' + SRC_DIR);
        process.exit(1);
    }

    console.log(`✅ Found ${modelFiles.length} models:\n`);

    const models: ModelInfo[] = [];

    for (const filePath of modelFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const modelName = extractModelName(content);

        if (!modelName) {
            console.warn(`⚠️  Skipping (no model name found): ${path.basename(filePath)}`);
            continue;
        }

        const fields = parseSchemaFields(content);
        console.log(`  📄 ${modelName} (${path.basename(filePath)}) → ${fields.length} fields`);
        models.push({ modelName, fields });
    }

    if (models.length === 0) {
        console.error('❌ No valid models could be parsed.');
        process.exit(1);
    }

    const mermaidContent = generateMermaidERD(models);
    fs.writeFileSync(OUTPUT_FILE, mermaidContent, 'utf8');

    console.log(`\n🎉 ERD successfully generated!`);
    console.log(`📁 File saved at: ${OUTPUT_FILE}`);
    console.log(`\nOpen DATABASE_ERD.md in VSCode with Markdown Preview to see the diagram.`);
    console.log(`(Install "Markdown Preview Mermaid Support" extension if not already installed)`);
}

main();
