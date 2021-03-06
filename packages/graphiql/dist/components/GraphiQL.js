"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphiQL = void 0;
var react_1 = __importStar(require("react"));
var graphql_1 = require("graphql");
var copy_to_clipboard_1 = __importDefault(require("copy-to-clipboard"));
var ExecuteButton_1 = require("./ExecuteButton");
var ImagePreview_1 = require("./ImagePreview");
var ToolbarButton_1 = require("./ToolbarButton");
var ToolbarGroup_1 = require("./ToolbarGroup");
var ToolbarMenu_1 = require("./ToolbarMenu");
var QueryEditor_1 = require("./QueryEditor");
var VariableEditor_1 = require("./VariableEditor");
var HeaderEditor_1 = require("./HeaderEditor");
var ResultViewer_1 = require("./ResultViewer");
var DocExplorer_1 = require("./DocExplorer");
var QueryHistory_1 = require("./QueryHistory");
var CodeMirrorSizer_1 = __importDefault(require("../utility/CodeMirrorSizer"));
var StorageAPI_1 = __importDefault(require("../utility/StorageAPI"));
var getQueryFacts_1 = __importDefault(require("../utility/getQueryFacts"));
var getSelectedOperationName_1 = __importDefault(require("../utility/getSelectedOperationName"));
var debounce_1 = __importDefault(require("../utility/debounce"));
var find_1 = __importDefault(require("../utility/find"));
var fillLeafs_1 = require("../utility/fillLeafs");
var elementPosition_1 = require("../utility/elementPosition");
var mergeAst_1 = __importDefault(require("../utility/mergeAst"));
var introspectionQueries_1 = require("../utility/introspectionQueries");
var DEFAULT_DOC_EXPLORER_WIDTH = 350;
var majorVersion = parseInt(react_1.default.version.slice(0, 2), 10);
if (majorVersion < 16) {
    throw Error([
        'GraphiQL 0.18.0 and after is not compatible with React 15 or below.',
        'If you are using a CDN source (jsdelivr, unpkg, etc), follow this example:',
        'https://github.com/graphql/graphiql/blob/master/examples/graphiql-cdn/index.html#L49',
    ].join('\n'));
}
var GraphiQL = (function (_super) {
    __extends(GraphiQL, _super);
    function GraphiQL(props) {
        var _a, _b;
        var _this = _super.call(this, props) || this;
        _this._editorQueryID = 0;
        _this.safeSetState = function (nextState, callback) {
            _this.componentIsMounted && _this.setState(nextState, callback);
        };
        _this.handleClickReference = function (reference) {
            _this.setState({ docExplorerOpen: true }, function () {
                if (_this.docExplorerComponent) {
                    _this.docExplorerComponent.showDocForReference(reference);
                }
            });
            _this._storage.set('docExplorerOpen', JSON.stringify(_this.state.docExplorerOpen));
        };
        _this.handleRunQuery = function (selectedOperationName) {
            _this._editorQueryID++;
            var queryID = _this._editorQueryID;
            var editedQuery = _this.autoCompleteLeafs() || _this.state.query;
            var variables = _this.state.variables;
            var headers = _this.state.headers;
            var shouldPersistHeaders = _this.state.shouldPersistHeaders;
            var operationName = _this.state.operationName;
            if (selectedOperationName && selectedOperationName !== operationName) {
                operationName = selectedOperationName;
                _this.handleEditOperationName(operationName);
            }
            try {
                _this.setState({
                    isWaitingForResponse: true,
                    response: undefined,
                    operationName: operationName,
                });
                _this._storage.set('operationName', operationName);
                if (_this._queryHistory) {
                    _this._queryHistory.updateHistory(editedQuery, variables, headers, operationName);
                }
                var subscription = _this._fetchQuery(editedQuery, variables, headers, operationName, shouldPersistHeaders, function (result) {
                    if (queryID === _this._editorQueryID) {
                        _this.setState({
                            isWaitingForResponse: false,
                            response: GraphiQL.formatResult(result),
                        });
                    }
                });
                _this.setState({ subscription: subscription });
            }
            catch (error) {
                _this.setState({
                    isWaitingForResponse: false,
                    response: error.message,
                });
            }
        };
        _this.handleStopQuery = function () {
            var subscription = _this.state.subscription;
            _this.setState({
                isWaitingForResponse: false,
                subscription: null,
            });
            if (subscription) {
                subscription.unsubscribe();
            }
        };
        _this.handlePrettifyQuery = function () {
            var _a, _b, _c;
            var editor = _this.getQueryEditor();
            var editorContent = (_a = editor === null || editor === void 0 ? void 0 : editor.getValue()) !== null && _a !== void 0 ? _a : '';
            var prettifiedEditorContent = graphql_1.print(graphql_1.parse(editorContent));
            if (prettifiedEditorContent !== editorContent) {
                editor === null || editor === void 0 ? void 0 : editor.setValue(prettifiedEditorContent);
            }
            var variableEditor = _this.getVariableEditor();
            var variableEditorContent = (_b = variableEditor === null || variableEditor === void 0 ? void 0 : variableEditor.getValue()) !== null && _b !== void 0 ? _b : '';
            try {
                var prettifiedVariableEditorContent = JSON.stringify(JSON.parse(variableEditorContent), null, 2);
                if (prettifiedVariableEditorContent !== variableEditorContent) {
                    variableEditor === null || variableEditor === void 0 ? void 0 : variableEditor.setValue(prettifiedVariableEditorContent);
                }
            }
            catch (_d) {
            }
            var headerEditor = _this.getHeaderEditor();
            var headerEditorContent = (_c = headerEditor === null || headerEditor === void 0 ? void 0 : headerEditor.getValue()) !== null && _c !== void 0 ? _c : '';
            try {
                var prettifiedHeaderEditorContent = JSON.stringify(JSON.parse(headerEditorContent), null, 2);
                if (prettifiedHeaderEditorContent !== headerEditorContent) {
                    headerEditor === null || headerEditor === void 0 ? void 0 : headerEditor.setValue(prettifiedHeaderEditorContent);
                }
            }
            catch (_e) {
            }
        };
        _this.handleMergeQuery = function () {
            var editor = _this.getQueryEditor();
            var query = editor.getValue();
            if (!query) {
                return;
            }
            var ast = graphql_1.parse(query);
            editor.setValue(graphql_1.print(mergeAst_1.default(ast, _this.state.schema)));
        };
        _this.handleEditQuery = debounce_1.default(100, function (value) {
            var queryFacts = _this._updateQueryFacts(value, _this.state.operationName, _this.state.operations, _this.state.schema);
            _this.setState(__assign({ query: value }, queryFacts));
            _this._storage.set('query', value);
            if (_this.props.onEditQuery) {
                return _this.props.onEditQuery(value);
            }
        });
        _this.handleCopyQuery = function () {
            var editor = _this.getQueryEditor();
            var query = editor && editor.getValue();
            if (!query) {
                return;
            }
            copy_to_clipboard_1.default(query);
            if (_this.props.onCopyQuery) {
                return _this.props.onCopyQuery(query);
            }
        };
        _this._updateQueryFacts = function (query, operationName, prevOperations, schema) {
            var queryFacts = getQueryFacts_1.default(schema, query);
            if (queryFacts) {
                var updatedOperationName = getSelectedOperationName_1.default(prevOperations, operationName, queryFacts.operations);
                var onEditOperationName = _this.props.onEditOperationName;
                if (onEditOperationName &&
                    updatedOperationName &&
                    operationName !== updatedOperationName) {
                    onEditOperationName(updatedOperationName);
                }
                return __assign({ operationName: updatedOperationName }, queryFacts);
            }
        };
        _this.handleEditVariables = function (value) {
            _this.setState({ variables: value });
            debounce_1.default(500, function () { return _this._storage.set('variables', value); })();
            if (_this.props.onEditVariables) {
                _this.props.onEditVariables(value);
            }
        };
        _this.handleEditHeaders = function (value) {
            _this.setState({ headers: value });
            _this.props.shouldPersistHeaders &&
                debounce_1.default(500, function () { return _this._storage.set('headers', value); })();
            if (_this.props.onEditHeaders) {
                _this.props.onEditHeaders(value);
            }
        };
        _this.handleEditOperationName = function (operationName) {
            var onEditOperationName = _this.props.onEditOperationName;
            if (onEditOperationName) {
                onEditOperationName(operationName);
            }
        };
        _this.handleHintInformationRender = function (elem) {
            elem.addEventListener('click', _this._onClickHintInformation);
            var onRemoveFn;
            elem.addEventListener('DOMNodeRemoved', (onRemoveFn = function () {
                elem.removeEventListener('DOMNodeRemoved', onRemoveFn);
                elem.removeEventListener('click', _this._onClickHintInformation);
            }));
        };
        _this.handleEditorRunQuery = function () {
            _this._runQueryAtCursor();
        };
        _this._onClickHintInformation = function (event) {
            if ((event === null || event === void 0 ? void 0 : event.currentTarget) &&
                'className' in event.currentTarget &&
                event.currentTarget.className === 'typeName') {
                var typeName = event.currentTarget.innerHTML;
                var schema = _this.state.schema;
                if (schema) {
                    var type_1 = schema.getType(typeName);
                    if (type_1) {
                        _this.setState({ docExplorerOpen: true }, function () {
                            if (_this.docExplorerComponent) {
                                _this.docExplorerComponent.showDoc(type_1);
                            }
                        });
                        debounce_1.default(500, function () {
                            return _this._storage.set('docExplorerOpen', JSON.stringify(_this.state.docExplorerOpen));
                        })();
                    }
                }
            }
        };
        _this.handleToggleDocs = function () {
            if (typeof _this.props.onToggleDocs === 'function') {
                _this.props.onToggleDocs(!_this.state.docExplorerOpen);
            }
            _this._storage.set('docExplorerOpen', JSON.stringify(!_this.state.docExplorerOpen));
            _this.setState({ docExplorerOpen: !_this.state.docExplorerOpen });
        };
        _this.handleToggleHistory = function () {
            if (typeof _this.props.onToggleHistory === 'function') {
                _this.props.onToggleHistory(!_this.state.historyPaneOpen);
            }
            _this._storage.set('historyPaneOpen', JSON.stringify(!_this.state.historyPaneOpen));
            _this.setState({ historyPaneOpen: !_this.state.historyPaneOpen });
        };
        _this.handleSelectHistoryQuery = function (query, variables, headers, operationName) {
            if (query) {
                _this.handleEditQuery(query);
            }
            if (variables) {
                _this.handleEditVariables(variables);
            }
            if (headers) {
                _this.handleEditHeaders(headers);
            }
            if (operationName) {
                _this.handleEditOperationName(operationName);
            }
        };
        _this.handleResizeStart = function (downEvent) {
            if (!_this._didClickDragBar(downEvent)) {
                return;
            }
            downEvent.preventDefault();
            var offset = downEvent.clientX - elementPosition_1.getLeft(downEvent.target);
            var onMouseMove = function (moveEvent) {
                if (moveEvent.buttons === 0) {
                    return onMouseUp();
                }
                var editorBar = _this.editorBarComponent;
                var leftSize = moveEvent.clientX - elementPosition_1.getLeft(editorBar) - offset;
                var rightSize = editorBar.clientWidth - leftSize;
                _this.setState({ editorFlex: leftSize / rightSize });
                debounce_1.default(500, function () {
                    return _this._storage.set('editorFlex', JSON.stringify(_this.state.editorFlex));
                })();
            };
            var onMouseUp = function () {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                onMouseMove = null;
                onMouseUp = null;
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        _this.handleResetResize = function () {
            _this.setState({ editorFlex: 1 });
            _this._storage.set('editorFlex', JSON.stringify(_this.state.editorFlex));
        };
        _this.handleDocsResizeStart = function (downEvent) {
            downEvent.preventDefault();
            var hadWidth = _this.state.docExplorerWidth;
            var offset = downEvent.clientX - elementPosition_1.getLeft(downEvent.target);
            var onMouseMove = function (moveEvent) {
                if (moveEvent.buttons === 0) {
                    return onMouseUp();
                }
                var app = _this.graphiqlContainer;
                var cursorPos = moveEvent.clientX - elementPosition_1.getLeft(app) - offset;
                var docsSize = app.clientWidth - cursorPos;
                if (docsSize < 100) {
                    _this.setState({ docExplorerOpen: false });
                }
                else {
                    _this.setState({
                        docExplorerOpen: true,
                        docExplorerWidth: Math.min(docsSize, 650),
                    });
                    debounce_1.default(500, function () {
                        return _this._storage.set('docExplorerWidth', JSON.stringify(_this.state.docExplorerWidth));
                    })();
                }
                _this._storage.set('docExplorerOpen', JSON.stringify(_this.state.docExplorerOpen));
            };
            var onMouseUp = function () {
                if (!_this.state.docExplorerOpen) {
                    _this.setState({ docExplorerWidth: hadWidth });
                    debounce_1.default(500, function () {
                        return _this._storage.set('docExplorerWidth', JSON.stringify(_this.state.docExplorerWidth));
                    })();
                }
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                onMouseMove = null;
                onMouseUp = null;
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        _this.handleDocsResetResize = function () {
            _this.setState({
                docExplorerWidth: DEFAULT_DOC_EXPLORER_WIDTH,
            });
            debounce_1.default(500, function () {
                return _this._storage.set('docExplorerWidth', JSON.stringify(_this.state.docExplorerWidth));
            })();
        };
        _this.handleTabClickPropogation = function (downEvent) {
            downEvent.preventDefault();
            downEvent.stopPropagation();
        };
        _this.handleOpenHeaderEditorTab = function (_clickEvent) {
            _this.setState({
                headerEditorActive: true,
                variableEditorActive: false,
                secondaryEditorOpen: true,
            });
        };
        _this.handleOpenVariableEditorTab = function (_clickEvent) {
            _this.setState({
                headerEditorActive: false,
                variableEditorActive: true,
                secondaryEditorOpen: true,
            });
        };
        _this.handleSecondaryEditorResizeStart = function (downEvent) {
            downEvent.preventDefault();
            var didMove = false;
            var wasOpen = _this.state.secondaryEditorOpen;
            var hadHeight = _this.state.secondaryEditorHeight;
            var offset = downEvent.clientY - elementPosition_1.getTop(downEvent.target);
            var onMouseMove = function (moveEvent) {
                if (moveEvent.buttons === 0) {
                    return onMouseUp();
                }
                didMove = true;
                var editorBar = _this.editorBarComponent;
                var topSize = moveEvent.clientY - elementPosition_1.getTop(editorBar) - offset;
                var bottomSize = editorBar.clientHeight - topSize;
                if (bottomSize < 60) {
                    _this.setState({
                        secondaryEditorOpen: false,
                        secondaryEditorHeight: hadHeight,
                    });
                }
                else {
                    _this.setState({
                        secondaryEditorOpen: true,
                        secondaryEditorHeight: bottomSize,
                    });
                }
                debounce_1.default(500, function () {
                    return _this._storage.set('secondaryEditorHeight', JSON.stringify(_this.state.secondaryEditorHeight));
                })();
            };
            var onMouseUp = function () {
                if (!didMove) {
                    _this.setState({ secondaryEditorOpen: !wasOpen });
                }
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                onMouseMove = null;
                onMouseUp = null;
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        if (typeof props.fetcher !== 'function') {
            throw new TypeError('GraphiQL requires a fetcher function.');
        }
        _this._storage = new StorageAPI_1.default(props.storage);
        _this.componentIsMounted = false;
        var query = props.query !== undefined
            ? props.query
            : _this._storage.get('query')
                ? _this._storage.get('query')
                : props.defaultQuery !== undefined
                    ? props.defaultQuery
                    : defaultQuery;
        var queryFacts = getQueryFacts_1.default(props.schema, query);
        var variables = props.variables !== undefined
            ? props.variables
            : _this._storage.get('variables');
        var headers = props.headers !== undefined
            ? props.headers
            : _this._storage.get('headers');
        var operationName = props.operationName !== undefined
            ? props.operationName
            : getSelectedOperationName_1.default(undefined, _this._storage.get('operationName'), queryFacts && queryFacts.operations);
        var docExplorerOpen = props.docExplorerOpen || false;
        if (_this._storage.get('docExplorerOpen')) {
            docExplorerOpen = _this._storage.get('docExplorerOpen') === 'true';
        }
        var secondaryEditorOpen;
        if (props.defaultVariableEditorOpen !== undefined) {
            secondaryEditorOpen = props.defaultVariableEditorOpen;
        }
        else if (props.defaultSecondaryEditorOpen !== undefined) {
            secondaryEditorOpen = props.defaultSecondaryEditorOpen;
        }
        else {
            secondaryEditorOpen = Boolean(variables || headers);
        }
        var headerEditorEnabled = (_a = props.headerEditorEnabled) !== null && _a !== void 0 ? _a : false;
        var shouldPersistHeaders = (_b = props.shouldPersistHeaders) !== null && _b !== void 0 ? _b : false;
        _this.state = __assign({ schema: props.schema, query: query, variables: variables, headers: headers, operationName: operationName,
            docExplorerOpen: docExplorerOpen, response: props.response, editorFlex: Number(_this._storage.get('editorFlex')) || 1, secondaryEditorOpen: secondaryEditorOpen, secondaryEditorHeight: Number(_this._storage.get('secondaryEditorHeight')) || 200, variableEditorActive: _this._storage.get('variableEditorActive') === 'true' ||
                props.headerEditorEnabled
                ? _this._storage.get('headerEditorActive') !== 'true'
                : true, headerEditorActive: _this._storage.get('headerEditorActive') === 'true', headerEditorEnabled: headerEditorEnabled,
            shouldPersistHeaders: shouldPersistHeaders, historyPaneOpen: _this._storage.get('historyPaneOpen') === 'true' || false, docExplorerWidth: Number(_this._storage.get('docExplorerWidth')) ||
                DEFAULT_DOC_EXPLORER_WIDTH, isWaitingForResponse: false, subscription: null }, queryFacts);
        return _this;
    }
    GraphiQL.formatResult = function (result) {
        return JSON.stringify(result, null, 2);
    };
    GraphiQL.formatError = function (rawError) {
        var result = Array.isArray(rawError)
            ? rawError.map(formatSingleError)
            : formatSingleError(rawError);
        return JSON.stringify(result, null, 2);
    };
    GraphiQL.prototype.componentDidMount = function () {
        this.componentIsMounted = true;
        if (this.state.schema === undefined) {
            this.fetchSchema();
        }
        this.codeMirrorSizer = new CodeMirrorSizer_1.default();
        global.g = this;
    };
    GraphiQL.prototype.UNSAFE_componentWillMount = function () {
        this.componentIsMounted = false;
    };
    GraphiQL.prototype.UNSAFE_componentWillReceiveProps = function (nextProps) {
        var _this = this;
        var nextSchema = this.state.schema;
        var nextQuery = this.state.query;
        var nextVariables = this.state.variables;
        var nextHeaders = this.state.headers;
        var nextOperationName = this.state.operationName;
        var nextResponse = this.state.response;
        if (nextProps.schema !== undefined) {
            nextSchema = nextProps.schema;
        }
        if (nextProps.query !== undefined && this.props.query !== nextProps.query) {
            nextQuery = nextProps.query;
        }
        if (nextProps.variables !== undefined &&
            this.props.variables !== nextProps.variables) {
            nextVariables = nextProps.variables;
        }
        if (nextProps.headers !== undefined &&
            this.props.headers !== nextProps.headers) {
            nextHeaders = nextProps.headers;
        }
        if (nextProps.operationName !== undefined) {
            nextOperationName = nextProps.operationName;
        }
        if (nextProps.response !== undefined) {
            nextResponse = nextProps.response;
        }
        if (nextQuery &&
            nextSchema &&
            (nextSchema !== this.state.schema ||
                nextQuery !== this.state.query ||
                nextOperationName !== this.state.operationName)) {
            var updatedQueryAttributes = this._updateQueryFacts(nextQuery, nextOperationName, this.state.operations, nextSchema);
            if (updatedQueryAttributes !== undefined) {
                nextOperationName = updatedQueryAttributes.operationName;
                this.setState(updatedQueryAttributes);
            }
        }
        if (nextProps.schema === undefined &&
            nextProps.fetcher !== this.props.fetcher) {
            nextSchema = undefined;
        }
        this._storage.set('operationName', nextOperationName);
        this.setState({
            schema: nextSchema,
            query: nextQuery,
            variables: nextVariables,
            headers: nextHeaders,
            operationName: nextOperationName,
            response: nextResponse,
        }, function () {
            if (_this.state.schema === undefined) {
                if (_this.docExplorerComponent) {
                    _this.docExplorerComponent.reset();
                }
                _this.fetchSchema();
            }
        });
    };
    GraphiQL.prototype.componentDidUpdate = function () {
        this.codeMirrorSizer.updateSizes([
            this.queryEditorComponent,
            this.variableEditorComponent,
            this.headerEditorComponent,
            this.resultComponent,
        ]);
    };
    GraphiQL.prototype.render = function () {
        var _this = this;
        var children = react_1.default.Children.toArray(this.props.children);
        var footer = find_1.default(children, function (child) {
            return isChildComponentType(child, GraphiQL.Footer);
        });
        var queryWrapStyle = {
            WebkitFlex: this.state.editorFlex,
            flex: this.state.editorFlex,
        };
        var docWrapStyle = {
            display: 'block',
            width: this.state.docExplorerWidth,
        };
        var docExplorerWrapClasses = 'docExplorerWrap' +
            (this.state.docExplorerWidth < 200 ? ' doc-explorer-narrow' : '');
        var historyPaneStyle = {
            display: this.state.historyPaneOpen ? 'block' : 'none',
            width: '230px',
            zIndex: 7,
        };
        var secondaryEditorOpen = this.state.secondaryEditorOpen;
        var secondaryEditorStyle = {
            height: secondaryEditorOpen
                ? this.state.secondaryEditorHeight
                : undefined,
        };
        return (react_1.default.createElement(react_1.Fragment, null, this.props.render && this.props.render({
            ExecuteButton: function (_a) {
                var className = _a.className;
                return (react_1.default.createElement(ExecuteButton_1.ExecuteButton, { className: className, isRunning: Boolean(_this.state.subscription), onRun: _this.handleRunQuery, onStop: _this.handleStopQuery, operations: _this.state.operations }));
            },
            Logo: GraphiQL.Logo,
            GraphiQLEditor: (react_1.default.createElement("div", { ref: function (n) {
                    _this.graphiqlContainer = n;
                }, className: "graphiql-container" },
                react_1.default.createElement("div", { className: "historyPaneWrap", style: historyPaneStyle },
                    react_1.default.createElement(QueryHistory_1.QueryHistory, { ref: function (node) {
                            _this._queryHistory = node;
                        }, operationName: this.state.operationName, query: this.state.query, variables: this.state.variables, onSelectQuery: this.handleSelectHistoryQuery, storage: this._storage, queryID: this._editorQueryID },
                        react_1.default.createElement("button", { className: "docExplorerHide", onClick: this.handleToggleHistory, "aria-label": "Close History" }, '\u2715'))),
                react_1.default.createElement("div", { className: "editorWrap" },
                    react_1.default.createElement("div", { ref: function (n) {
                            _this.editorBarComponent = n;
                        }, className: "editorBar", onDoubleClick: this.handleResetResize, onMouseDown: this.handleResizeStart },
                        react_1.default.createElement("div", { className: "queryWrap", style: queryWrapStyle },
                            react_1.default.createElement(QueryEditor_1.QueryEditor, { ref: function (n) {
                                    _this.queryEditorComponent = n;
                                }, schema: this.state.schema, value: this.state.query, onEdit: this.handleEditQuery, onHintInformationRender: this.handleHintInformationRender, onClickReference: this.handleClickReference, onCopyQuery: this.handleCopyQuery, onPrettifyQuery: this.handlePrettifyQuery, onMergeQuery: this.handleMergeQuery, onRunQuery: this.handleEditorRunQuery, editorTheme: this.props.editorTheme, readOnly: this.props.readOnly }),
                            react_1.default.createElement("section", { className: "variable-editor secondary-editor", style: secondaryEditorStyle, "aria-label": this.state.variableEditorActive
                                    ? 'Query Variables'
                                    : 'Request Headers' },
                                react_1.default.createElement("div", { className: "secondary-editor-title variable-editor-title", id: "secondary-editor-title", style: {
                                        cursor: secondaryEditorOpen ? 'row-resize' : 'n-resize',
                                    }, onMouseDown: this.handleSecondaryEditorResizeStart },
                                    react_1.default.createElement("div", { style: {
                                            cursor: 'pointer',
                                            color: this.state.variableEditorActive ? '#000' : 'gray',
                                            display: 'inline-block',
                                        }, onClick: this.handleOpenVariableEditorTab, onMouseDown: this.handleTabClickPropogation }, 'Query Variables'),
                                    this.state.headerEditorEnabled && (react_1.default.createElement("div", { style: {
                                            cursor: 'pointer',
                                            color: this.state.headerEditorActive ? '#000' : 'gray',
                                            display: 'inline-block',
                                            marginLeft: '20px',
                                        }, onClick: this.handleOpenHeaderEditorTab, onMouseDown: this.handleTabClickPropogation }, 'Request Headers'))),
                                react_1.default.createElement(VariableEditor_1.VariableEditor, { ref: function (n) {
                                        _this.variableEditorComponent = n;
                                    }, value: this.state.variables, variableToType: this.state.variableToType, onEdit: this.handleEditVariables, onHintInformationRender: this.handleHintInformationRender, onPrettifyQuery: this.handlePrettifyQuery, onMergeQuery: this.handleMergeQuery, onRunQuery: this.handleEditorRunQuery, editorTheme: this.props.editorTheme, readOnly: this.props.readOnly, active: this.state.variableEditorActive }),
                                this.state.headerEditorEnabled && (react_1.default.createElement(HeaderEditor_1.HeaderEditor, { ref: function (n) {
                                        _this.headerEditorComponent = n;
                                    }, value: this.state.headers, onEdit: this.handleEditHeaders, onHintInformationRender: this.handleHintInformationRender, onPrettifyQuery: this.handlePrettifyQuery, onMergeQuery: this.handleMergeQuery, onRunQuery: this.handleEditorRunQuery, editorTheme: this.props.editorTheme, readOnly: this.props.readOnly, active: this.state.headerEditorActive })))),
                        react_1.default.createElement("div", { className: "resultWrap" },
                            this.state.isWaitingForResponse && (react_1.default.createElement("div", { className: "spinner-container" },
                                react_1.default.createElement("div", { className: "spinner" }))),
                            react_1.default.createElement(ResultViewer_1.ResultViewer, { registerRef: function (n) {
                                    _this.resultViewerElement = n;
                                }, ref: function (c) {
                                    _this.resultComponent = c;
                                }, value: this.state.response, editorTheme: this.props.editorTheme, ResultsTooltip: this.props.ResultsTooltip, ImagePreview: ImagePreview_1.ImagePreview }),
                            footer))))),
            DocExplorer: function (_a) {
                var onToggleDocs = _a.onToggleDocs;
                return (react_1.default.createElement("div", { className: docExplorerWrapClasses, style: docWrapStyle },
                    react_1.default.createElement("div", { className: "docExplorerResizer", onDoubleClick: _this.handleDocsResetResize, onMouseDown: _this.handleDocsResizeStart }),
                    react_1.default.createElement(DocExplorer_1.DocExplorer, { ref: function (c) {
                            _this.docExplorerComponent = c;
                        }, schema: _this.state.schema },
                        react_1.default.createElement("button", { className: "docExplorerHide", onClick: onToggleDocs, "aria-label": "Close Documentation Explorer" }, '\u2715'))));
            },
        })));
    };
    GraphiQL.prototype.getQueryEditor = function () {
        if (this.queryEditorComponent) {
            return this.queryEditorComponent.getCodeMirror();
        }
    };
    GraphiQL.prototype.getVariableEditor = function () {
        if (this.variableEditorComponent) {
            return this.variableEditorComponent.getCodeMirror();
        }
        return null;
    };
    GraphiQL.prototype.getHeaderEditor = function () {
        if (this.headerEditorComponent) {
            return this.headerEditorComponent.getCodeMirror();
        }
        return null;
    };
    GraphiQL.prototype.refresh = function () {
        if (this.queryEditorComponent) {
            this.queryEditorComponent.getCodeMirror().refresh();
        }
        if (this.variableEditorComponent) {
            this.variableEditorComponent.getCodeMirror().refresh();
        }
        if (this.headerEditorComponent) {
            this.headerEditorComponent.getCodeMirror().refresh();
        }
        if (this.resultComponent) {
            this.resultComponent.getCodeMirror().refresh();
        }
    };
    GraphiQL.prototype.autoCompleteLeafs = function () {
        var _a = fillLeafs_1.fillLeafs(this.state.schema, this.state.query, this.props.getDefaultFieldNames), insertions = _a.insertions, result = _a.result;
        if (insertions && insertions.length > 0) {
            var editor_1 = this.getQueryEditor();
            if (editor_1) {
                editor_1.operation(function () {
                    var cursor = editor_1.getCursor();
                    var cursorIndex = editor_1.indexFromPos(cursor);
                    editor_1.setValue(result || '');
                    var added = 0;
                    var markers = insertions.map(function (_a) {
                        var index = _a.index, string = _a.string;
                        return editor_1.markText(editor_1.posFromIndex(index + added), editor_1.posFromIndex(index + (added += string.length)), {
                            className: 'autoInsertedLeaf',
                            clearOnEnter: true,
                            title: 'Automatically added leaf fields',
                        });
                    });
                    setTimeout(function () { return markers.forEach(function (marker) { return marker.clear(); }); }, 7000);
                    var newCursorIndex = cursorIndex;
                    insertions.forEach(function (_a) {
                        var index = _a.index, string = _a.string;
                        if (index < cursorIndex) {
                            newCursorIndex += string.length;
                        }
                    });
                    editor_1.setCursor(editor_1.posFromIndex(newCursorIndex));
                });
            }
        }
        return result;
    };
    GraphiQL.prototype.fetchSchema = function () {
        var _this = this;
        var fetcher = this.props.fetcher;
        var fetcherOpts = {
            shouldPersistHeaders: Boolean(this.props.shouldPersistHeaders),
        };
        if (this.state.headers && this.state.headers.trim().length > 2) {
            fetcherOpts.headers = JSON.parse(this.state.headers);
        }
        else if (this.props.headers) {
            fetcherOpts.headers = JSON.parse(this.props.headers);
        }
        var fetch = observableToPromise(fetcher({
            query: introspectionQueries_1.introspectionQuery,
            operationName: introspectionQueries_1.introspectionQueryName,
        }, fetcherOpts));
        if (!isPromise(fetch)) {
            this.setState({
                response: 'Fetcher did not return a Promise for introspection.',
            });
            return;
        }
        fetch
            .then(function (result) {
            if (typeof result !== 'string' && 'data' in result) {
                return result;
            }
            var fetch2 = observableToPromise(fetcher({
                query: introspectionQueries_1.introspectionQuerySansSubscriptions,
                operationName: introspectionQueries_1.introspectionQueryName,
            }, fetcherOpts));
            if (!isPromise(fetch)) {
                throw new Error('Fetcher did not return a Promise for introspection.');
            }
            return fetch2;
        })
            .then(function (result) {
            if (_this.state.schema !== undefined) {
                return;
            }
            if (typeof result !== 'string' && 'data' in result) {
                var schema = graphql_1.buildClientSchema(result.data);
                var queryFacts = getQueryFacts_1.default(schema, _this.state.query);
                _this.safeSetState(__assign({ schema: schema }, queryFacts));
            }
            else {
                var responseString = typeof result === 'string' ? result : GraphiQL.formatResult(result);
                _this.safeSetState({
                    schema: undefined,
                    response: responseString,
                });
            }
        })
            .catch(function (error) {
            _this.safeSetState({
                schema: undefined,
                response: error ? GraphiQL.formatError(error) : undefined,
            });
        });
    };
    GraphiQL.prototype._fetchQuery = function (query, variables, headers, operationName, shouldPersistHeaders, cb) {
        var _this = this;
        var fetcher = this.props.fetcher;
        var jsonVariables = null;
        var jsonHeaders = null;
        try {
            jsonVariables =
                variables && variables.trim() !== '' ? JSON.parse(variables) : null;
        }
        catch (error) {
            throw new Error("Variables are invalid JSON: " + error.message + ".");
        }
        if (typeof jsonVariables !== 'object') {
            throw new Error('Variables are not a JSON object.');
        }
        try {
            jsonHeaders =
                headers && headers.trim() !== '' ? JSON.parse(headers) : null;
        }
        catch (error) {
            throw new Error("Headers are invalid JSON: " + error.message + ".");
        }
        if (typeof jsonHeaders !== 'object') {
            throw new Error('Headers are not a JSON object.');
        }
        var fetch = fetcher({
            query: query,
            variables: jsonVariables,
            operationName: operationName,
        }, { headers: jsonHeaders, shouldPersistHeaders: shouldPersistHeaders });
        if (isPromise(fetch)) {
            fetch.then(cb).catch(function (error) {
                _this.safeSetState({
                    isWaitingForResponse: false,
                    response: error ? GraphiQL.formatError(error) : undefined,
                });
            });
        }
        else if (isObservable(fetch)) {
            var subscription = fetch.subscribe({
                next: cb,
                error: function (error) {
                    _this.safeSetState({
                        isWaitingForResponse: false,
                        response: error ? GraphiQL.formatError(error) : undefined,
                        subscription: null,
                    });
                },
                complete: function () {
                    _this.safeSetState({
                        isWaitingForResponse: false,
                        subscription: null,
                    });
                },
            });
            return subscription;
        }
        else {
            throw new Error('Fetcher did not return Promise or Observable.');
        }
    };
    GraphiQL.prototype._runQueryAtCursor = function () {
        if (this.state.subscription) {
            this.handleStopQuery();
            return;
        }
        var operationName;
        var operations = this.state.operations;
        if (operations) {
            var editor = this.getQueryEditor();
            if (editor && editor.hasFocus()) {
                var cursor = editor.getCursor();
                var cursorIndex = editor.indexFromPos(cursor);
                for (var i = 0; i < operations.length; i++) {
                    var operation = operations[i];
                    if (operation.loc &&
                        operation.loc.start <= cursorIndex &&
                        operation.loc.end >= cursorIndex) {
                        operationName = operation.name && operation.name.value;
                        break;
                    }
                }
            }
        }
        this.handleRunQuery(operationName);
    };
    GraphiQL.prototype._didClickDragBar = function (event) {
        if (event.button !== 0 || event.ctrlKey) {
            return false;
        }
        var target = event.target;
        if (target.className.indexOf('CodeMirror-gutter') !== 0) {
            return false;
        }
        var resultWindow = this.resultViewerElement;
        while (target) {
            if (target === resultWindow) {
                return true;
            }
            target = target.parentNode;
        }
        return false;
    };
    GraphiQL.Logo = GraphiQLLogo;
    GraphiQL.Toolbar = GraphiQLToolbar;
    GraphiQL.Footer = GraphiQLFooter;
    GraphiQL.QueryEditor = QueryEditor_1.QueryEditor;
    GraphiQL.VariableEditor = VariableEditor_1.VariableEditor;
    GraphiQL.HeaderEditor = HeaderEditor_1.HeaderEditor;
    GraphiQL.ResultViewer = ResultViewer_1.ResultViewer;
    GraphiQL.Button = ToolbarButton_1.ToolbarButton;
    GraphiQL.ToolbarButton = ToolbarButton_1.ToolbarButton;
    GraphiQL.Group = ToolbarGroup_1.ToolbarGroup;
    GraphiQL.Menu = ToolbarMenu_1.ToolbarMenu;
    GraphiQL.MenuItem = ToolbarMenu_1.ToolbarMenuItem;
    return GraphiQL;
}(react_1.default.Component));
exports.GraphiQL = GraphiQL;
function GraphiQLLogo(props) {
    return (react_1.default.createElement("div", { className: "title" }, props.children || (react_1.default.createElement("span", null,
        'Graph',
        react_1.default.createElement("em", null, 'i'),
        'QL'))));
}
GraphiQLLogo.displayName = 'GraphiQLLogo';
function GraphiQLToolbar(props) {
    return (react_1.default.createElement("div", { className: "toolbar", role: "toolbar", "aria-label": "Editor Commands" }, props.children));
}
GraphiQLToolbar.displayName = 'GraphiQLToolbar';
function GraphiQLFooter(props) {
    return react_1.default.createElement("div", { className: "footer" }, props.children);
}
GraphiQLFooter.displayName = 'GraphiQLFooter';
var formatSingleError = function (error) { return (__assign(__assign({}, error), { message: error.message, stack: error.stack })); };
var defaultQuery = "# Welcome to GraphiQL\n#\n# GraphiQL is an in-browser tool for writing, validating, and\n# testing GraphQL queries.\n#\n# Type queries into this side of the screen, and you will see intelligent\n# typeaheads aware of the current GraphQL type schema and live syntax and\n# validation errors highlighted within the text.\n#\n# GraphQL queries typically start with a \"{\" character. Lines that start\n# with a # are ignored.\n#\n# An example GraphQL query might look like:\n#\n#     {\n#       field(arg: \"value\") {\n#         subField\n#       }\n#     }\n#\n# Keyboard shortcuts:\n#\n#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)\n#\n#     Merge Query:  Shift-Ctrl-M (or press the merge button above)\n#\n#       Run Query:  Ctrl-Enter (or press the play button above)\n#\n#   Auto Complete:  Ctrl-Space (or just start typing)\n#\n\n";
function isPromise(value) {
    return typeof value === 'object' && typeof value.then === 'function';
}
function observableToPromise(observable) {
    if (!isObservable(observable)) {
        return observable;
    }
    return new Promise(function (resolve, reject) {
        var subscription = observable.subscribe(function (v) {
            resolve(v);
            subscription.unsubscribe();
        }, reject, function () {
            reject(new Error('no value resolved'));
        });
    });
}
function isObservable(value) {
    return (typeof value === 'object' &&
        'subscribe' in value &&
        typeof value.subscribe === 'function');
}
function isChildComponentType(child, component) {
    var _a;
    if (((_a = child === null || child === void 0 ? void 0 : child.type) === null || _a === void 0 ? void 0 : _a.displayName) &&
        child.type.displayName === component.displayName) {
        return true;
    }
    return child.type === component;
}
//# sourceMappingURL=GraphiQL.js.map