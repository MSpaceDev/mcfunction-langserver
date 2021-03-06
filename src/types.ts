import { DataInterval, Interval, IntervalTree } from "node-interval-tree";
import { JSONDocument } from "vscode-json-languageservice";
import {
    CompletionItemKind,
    InsertTextFormat,
    MarkupContent,
    TextDocument
} from "vscode-languageserver/lib/main";

import { BlankCommandError, CommandError } from "./brigadier/errors";
import { StringReader } from "./brigadier/string-reader";
import {
    CommandNodePath,
    GlobalData,
    LocalData,
    NamespacedName
} from "./data/types";
import { PackLocationSegments } from "./misc-functions";
import { TypedNode } from "./parsers/minecraft/nbt/util/doc-walker-util";

//#region Document
export interface FunctionInfo {
    lines: CommandLine[];
    /**
     * The filesystem path to the `datapacks` folder this is part of - NOT the folder of the single datapack
     */
    pack_segments: PackLocationSegments | undefined;
}

export interface WorkspaceSecurity {
    // CustomParsers?: boolean;
    JarPath?: boolean;
    JavaPath?: boolean;
}

export interface CommandLine {
    /**
     * A cache of the tree of actions
     */
    actions?: IntervalTree<SubAction>;
    nodes?: IntervalTree<ParseNode>;
    parseInfo?: StoredParseResult | false;
    text: string;
}
//#endregion

//#region Interaction with parsers
export interface ParserInfo {
    /**
     * The immutable context
     */
    context: CommandContext;
    data: CommandData;
    node_properties: Dictionary<any>;
    path: CommandNodePath; // Will be > 0
    /**
     * When suggesting, the end of the reader's string will be the cursor position
     */
    suggesting: boolean;
}

export interface CommandData {
    globalData: GlobalData;
    /**
     * Data from datapacks
     */
    localData?: LocalData;
}

export interface Suggestion {
    description?: string | MarkupContent;
    insertTextFormat?: InsertTextFormat;
    kind?: CompletionItemKind;
    label?: string;
    /**
     * The start from where value should be replaced. 0 indexed character gaps.
     * E.g. `@e[na` with the suggestion `{value:"name=",start:3}`
     * would make `@e[name=` when accepted.
     */
    start: number;
    text: string;
}

export type SuggestResult = Suggestion | string;

/**
 * A change to the shared context
 */
export type ContextChange = Partial<CommandContext> | undefined;

export interface CommandContext {
    // [key: string]: any;
    /**
     * What we know about the executor of the commmand.
     *
     * TODO: Possibly allow specifying this within a function as a sort of shebang,
     * then validate all function calls with this requirement
     */
    executor?: EntityInfo;
    /**
     * The result from an nbt path
     */
    nbt_path?: TypedNode["type"];
    /**
     * A different entity which is important during parsing
     */
    otherEntity?: EntityInfo;
}

export interface EntityInfo {
    /**
     * The possible entity types of this entity
     */
    ids?: NamespacedName[];
}

export interface Parser {
    /**
     * The default suggestion kind for suggestions from this parser
     */
    kind?: CompletionItemKind;
    /**
     * Parse the argument as described in NodeProperties against this parser in the reader.
     * Gets both suggestions and success
     */
    parse(
        reader: StringReader,
        properties: ParserInfo
    ): ReturnedInfo<ContextChange | undefined>;
}

//#endregion
//#region ParsingData
export interface ParseNode extends Interval {
    context: CommandContext;
    final?: CommandContext;
    path: CommandNodePath;
}

export interface StoredParseResult {
    actions: SubAction[];
    errors: CommandError[];
    nodes: ParseNode[];
}

interface SubActionBase<U extends string, T> extends DataInterval<T> {
    type: U;
}

export interface JSONDocInfo {
    json: JSONDocument;
    text: TextDocument;
}

export type SubAction =
    // See https://github.com/Microsoft/language-server-protocol/issues/518.
    // tslint:disable-next-line:deprecation - TODO: this needs a PR to fix
    | SubActionBase<"hover", string>
    | SubActionBase<"format", string>
    | SubActionBase<"source", string>
    | SubActionBase<"json", JSONDocInfo>;
//  | SubActionBase<"highlight", HighlightScope>;
//  | SubActionBase<"rename", RenameRequest>;

//#endregion
export type Success = true;
export const success: Success = true;

export const failure: Failure = false;
export type Failure = false;

//#region ReturnData
export interface ReturnData<ErrorKind extends BCE = CE> {
    actions: SubAction[];
    errors: ErrorKind[];
    /**
     * Points not related to a specific line being parsed.
     * This includes errors inside a file for example.
     */
    misc: MiscInfo[];
    suggestions: SuggestResult[];
}

type MiscInfoBase<kind extends string, value> = value & {
    kind: kind;
};

export type MiscInfo =
    | MiscInfoBase<"FileError", FileError>
    | MiscInfoBase<"ClearError", ClearFileError>;

interface FileError {
    filePath: string;
    group: string;
    message: string;
}

interface ClearFileError {
    filePath: string;
    group?: string;
}

/**
 * A general return type which can either succeed or fail, bringing other data
 */
export type ReturnedInfo<T, ErrorKind extends BCE = CE, E = undefined> =
    | ReturnSuccess<T, ErrorKind>
    | ReturnFailure<E, ErrorKind>;

export interface ReturnFailure<K = undefined, ErrorKind extends BCE = CE>
    extends ReturnData<ErrorKind> {
    data: K;
    kind: Failure;
}

export interface ReturnSuccess<T, ErrorKind extends BCE = CE>
    extends ReturnData<ErrorKind> {
    data: T;
    kind: Success;
}
//#endregion
// Helper types to lower the amount of repetition of the names
export type BCE = BlankCommandError;
export type CE = CommandError;

//#region Misc types

export interface LineRange {
    end: number;
    start: number;
}

export interface Ranged<T> {
    range: LineRange;
    value: T;
}

//#endregion
