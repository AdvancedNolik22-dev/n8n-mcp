import { z } from 'zod';
export declare const TemplateMetadataSchema: any;
export type TemplateMetadata = z.infer<typeof TemplateMetadataSchema>;
export interface MetadataRequest {
    templateId: number;
    name: string;
    description?: string;
    nodes: string[];
    workflow?: any;
}
export interface MetadataResult {
    templateId: number;
    metadata: TemplateMetadata;
    error?: string;
}
export declare class MetadataGenerator {
    private client;
    private model;
    constructor(apiKey: string, model?: string, baseURL?: string);
    private getJsonSchema;
    createBatchRequest(template: MetadataRequest): any;
    private sanitizeInput;
    private summarizeNodes;
    parseResult(result: any): MetadataResult;
    private getDefaultMetadata;
    buildChatRequest(template: MetadataRequest): {
        model: string;
        max_completion_tokens: number;
        response_format: any;
        messages: ({
            role: "system";
            content: string;
        } | {
            role: "user";
            content: string;
        })[];
    };
    generateDirect(template: MetadataRequest): Promise<MetadataResult>;
    generateSingle(template: MetadataRequest): Promise<TemplateMetadata>;
}
//# sourceMappingURL=metadata-generator.d.ts.map