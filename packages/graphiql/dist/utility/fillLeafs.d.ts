import { GraphQLSchema, GraphQLType } from 'graphql';
declare type Insertion = {
    index: number;
    string: string;
};
export declare type GetDefaultFieldNamesFn = (type: GraphQLType) => string[];
export declare function fillLeafs(schema?: GraphQLSchema, docString?: string, getDefaultFieldNames?: GetDefaultFieldNamesFn): {
    insertions: Insertion[];
    result: string | undefined;
};
export {};
//# sourceMappingURL=fillLeafs.d.ts.map