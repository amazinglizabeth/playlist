
/** TurtleGUI - a javascript GUI library. Shared using MIT license (see LICENSE file)
*/

var turtlegui = {};

turtlegui.root_element = null;
turtlegui.cached_snippets = {};
turtlegui.loading_snippets = {};

turtlegui.cached_evaluations = {};

turtlegui.stored_objects = {};
turtlegui.store_key = 0;


turtlegui.store = function(elem, key, value) {
    var elem_key;
    if (elem.turtlegui_store_key) {
        elem_key = elem.turtlegui_store_key;
    } else {
        elem_key = ++turtlegui.store_key;
        Object.defineProperty(elem, 'turtlegui_store_key', {value: elem_key, configurable: true}); 
    }
    if (!(elem_key in turtlegui.stored_objects)) {
        turtlegui.stored_objects[elem_key] = {}
    }
    turtlegui.stored_objects[elem_key][key] = value;
}

turtlegui.retrieve = function(elem, key) {
    if (elem.turtlegui_store_key) {
        return turtlegui.stored_objects[elem.turtlegui_store_key][key];
    } else {
        return null;
    }
}

turtlegui.remove_elements = function(elements) {
    for (var e=0; e<elements.length; e++) {
        var elem = elements[e];
        if (elem.turtlegui_store_key) {
            delete turtlegui.stored_objects[elem.turtlegui_store_key];
        }
        elem.remove()
    }
}


turtlegui.getstack = function(elm) {
    return elm.parentElement && elm.nodeName != 'BODY' && elm.parentElement.nodeName != 'BODY' ? turtlegui.getstack(elm.parentElement).concat([elm]) : [elm];
}

turtlegui.log = function(msg, extra) {
    if (window.console) {
        if (extra != null) {
            console.log(msg, extra);
        } else {
            console.log(msg);
        }
    }
}


turtlegui.log_error = function(msg, elem) {
    turtlegui.log("Error at:", elem);
    var stack = turtlegui.getstack(elem);
    for (var i=0; i<stack.length; i++) {
        var elm = stack[i];
        var desc = elm.nodeName + (elm.getAttribute('id')?'#'+elm.getAttribute('id'):"") + "\"" + elm.getAttribute('class') + "\"";
        try {
            var attributes = stack[i].getAttributeNames();
            var desc = '<' + elm.nodeName;
            for (var key=0; key<attributes.length; key++) {
                desc = desc + ' ' + attributes[key] + '="' + stack[i].getAttribute(attributes[key]) + '"';
            }
            desc = desc + '>';
        } catch (e) {
            turtlegui.log('getAttributeName unsupported');
        }
        turtlegui.log("  ".repeat(i) + desc);
    }
    turtlegui.log(msg);
}

turtlegui._is_string = function(token) {
    return token.length > 1 && (
                (token[0] == "'" && token[token.length-1] == "'") || (token[0] == '"' && token[token.length-1] == '"'))
}

turtlegui._not = function(val) {
    return !val;
}

turtlegui.resolve_field = function(gres, rel_data, elem) {
    if (gres in rel_data) {
        return rel_data[gres];
    } else if (gres in window) {
        return window[gres];
    } else if (gres == 'this') {
        return elem;
    } else {
        return undefined;
    }
}


turtlegui.evaluate = function(expression) {
    return turtlegui._reduce(turtlegui._shunt(turtlegui._token(expression)))
}


turtlegui._token = function(token_str) {
    function is_number(token) { return !isNaN(token) && !isNaN(parseFloat(token)); }
    function is_alpha(token) { return token >= 'a' && token <= 'z' || token >= 'A' && token <= 'Z' || token == '_'; }
    var operator_chars = ['.', '=', '|', '&', '!', '+', '-', '*', '/', '<', '>', ';'];
    var double_op_chars = ['=', '&', '|', '>', '<', '!'];
    var double_operators = ['==', '&&', '||', '>=', '<=', '!='];
    var brackets = ["(", ")", "[", "]"];
    var invalid_ref_chars = operator_chars + brackets + ["'", '"', ' '];

    var token_chars = token_str.split('');

    var tokens = [];

    while (token_chars.length) {
        while (token_chars.length && token_chars[0] == ' ') {
            token_chars.shift();
        }
        if (token_chars.length == 0) continue;
        var token_char = token_chars[0];

        if (token_char == '"' || token_char == "'") {
            // Process strings
            var str_token = '';
            var processing_string = token_chars.shift();
            while (token_chars.length && token_chars[0] != processing_string) {
                str_token += token_chars.shift();
            }
            if (!token_chars.length) { throw "Unterminated string constant"; }
            token_chars.shift();
            tokens.push(['s', str_token]);

        } else if (token_char == ',') {
            tokens.push(['c', token_chars.shift()]);
            continue;
        } else if (token_char == '.' && is_alpha(token_chars[1])) {
            token_chars.shift();
            var field_ref_token = '';
            while (token_chars.length && (is_alpha(token_chars[0]) || is_number(token_chars[0]))) {
                field_ref_token += token_chars.shift();
            }
            tokens.push(['f', field_ref_token]);
        } else if (token_char == '.' || is_number(token_char)) {
            // Process numbers
            var num_token = '';
            while (token_chars.length && (token_chars[0] == '.' || is_number(token_chars[0]))) {
                num_token += token_chars.shift();
            }
            if (num_token == '.') {
                tokens.push(['.', num_token]);
            } else {
                tokens.push(['n', parseFloat(num_token)]);
            }

        } else if (operator_chars.indexOf(token_char) != -1) {
            // Process operators
            var operator = token_chars.shift();
            if (double_op_chars.indexOf(token_char) != -1) {
                if (token_chars.length && double_operators.indexOf(operator + token_chars[0]) != -1) {
                    tokens.push(['o', operator + token_chars.shift()]);
                    continue;
                } else if (operator == '<' || operator == '>' || operator == '!' || operator == '=') {
                    tokens.push(['o', operator]);
                    continue;
                } else {
                    throw "Invalid operator: " + operator;
                }
            } else {
                if (operator == ',') {
                    tokens.push(['c', operator]);
                } else {
                    tokens.push(['o', operator]);
                }
                continue;
            }

        } else if (brackets.indexOf(token_char) != -1) {
            // Process brackets
            if (token_char == '(' || token_char == '[') {
                tokens.push(['O', token_chars.shift()]);
            } else {
                tokens.push(['B', token_chars.shift()]);
            }
            continue;

        } else {
            // Process reference
            var ref_token = '';
            while (token_chars.length && invalid_ref_chars.indexOf(token_chars[0]) == -1) {
                ref_token += token_chars.shift();
            }
            if (ref_token == 'true' || ref_token == 'false') {
                tokens.push(['b', ref_token == 'true']);
            } else {
                tokens.push(['r', ref_token]);
            }
        }
    }
    return tokens;
}


turtlegui._reduce = function(tokens, elem) {
    var rel_data = (elem ? (turtlegui.retrieve(elem, 'data-rel') || {}) : {});

    var queue = [];

    function shift_resolve() {
        var shifted = queue.shift();
        return resolve(shifted);
    }

    function resolve(shifted) {
        return shifted[0] == 'r' ? turtlegui.resolve_field(shifted[1], rel_data, elem) : shifted[1];
    }

    var operators = {
        '!': () => { return !shift_resolve(); }, 
        '!=': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs != rhs; },
        '||': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs || rhs; },
        '&&': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs && rhs; },
        '==': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs == rhs; },
        '-': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs - rhs; },
        '+': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs + rhs; },
        '*': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs * rhs; },
        '/': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs / rhs; },
        '>': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs > rhs; },
        '<': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs < rhs; },
        '>=': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs >= rhs; },
        '<=': () => { var rhs = shift_resolve(); var lhs = shift_resolve(); return lhs <= rhs; }
    };

    // Keeping reference to last object reference for 'this' keyword
    var object_ref = null;
    var object_ref_stack = [];

    for (var i=0; i<tokens.length; i++) {
        var token_type = tokens[i][0];
        var token = tokens[i][1];

        if (operators[token]) {
            // 'v' is for 'value' but it's not really important
            queue.unshift(['v', operators[token]()]);
        } else if (token == '=') {
            throw "Assignment (=) reduction is not supported";
        } else if (token == ';') {
            throw "Separator (;) reduction is not supported";
        } else if (token == '(') {
            if (queue.length > 0 && typeof(queue[0][1]) == 'function') {
                object_ref_stack.unshift(object_ref);
            }
            queue.unshift([token_type, token]);
        } else if (token == ')') {
            var params = [];
            var param_vals = [];
            while(queue.length && queue[0][1] != '(') {
                var queue_item = queue.shift();
                var queue_item_type = queue_item[0];
                var queue_item_val = queue_item[1];
                if (queue_item_type == 'r') {
                    queue_item_val = turtlegui.resolve_field(queue_item_val, rel_data, elem);
                }

                params.unshift(queue_item);
                param_vals.unshift(queue_item_val);

                if (queue.length && queue[0][1] == ',') {
                    queue.shift();
                }
            }
            queue.shift(); // pop the open bracket
            if (queue.length && (queue[0][0] == 'r' || queue[0][0] == 'v')) {
            //if (queue.length && typeof(queue[0][1]) == 'function') {
                // call function
                var queue_item = queue.shift();
                var queue_item_type = queue_item[0];
                var queue_item_val = queue_item[1];

                if (queue_item_type == 'r') {
                    queue_item_val = turtlegui.resolve_field(queue_item_val, rel_data, elem);
                }

                if (typeof(queue_item_val) == 'function') {
                    queue.unshift(['v', queue_item_val.apply(object_ref_stack.shift(), param_vals)]);
                } else {
                    queue.unshift(['v', queue_item_val]);
                    for (var p=0; p<params.length; p++ ) {
                        queue.unshift(params[p]);
                    }
                }
            } else {
                // Unwind when only brackets
                if (params.length > 1) { throw "Unexpected parameter list"; };
                queue.unshift(params[0]);
            }
        } else if (token == ']') {
            // assume one value
            var key = queue.shift();
            var key_type = key[0];
            var key_name = key[1];
            if (key_type == 'r') {
                key_name = turtlegui.resolve_field(key_name, rel_data, elem);
            }
            // pop opening '['
            var opening_bracket = queue.shift()[1];
            if (opening_bracket != '[') throw "Unexpected character: " + opening_bracket;
            // pop object
            var object = queue.shift();
            var object_type = object[0];
            var object_val = object[1];
            if (object_type == 'r') {
                object_ref = turtlegui.resolve_field(object_val, rel_data, elem);
                queue.unshift(['v', object_ref[key_name]]);
            } else {
                object_ref = object_val;
                queue.unshift(['v', object_val[key_name]]);
            }
        } else if (token_type == 'f') {
            var object = queue.shift();
            var object_type = object[0];
            var object_val = object[1];

            if (object_type == 'r') {
                object_ref = turtlegui.resolve_field(object_val, rel_data, elem);
                queue.unshift(['v', object_ref[token]]);
            } else if (object_type == 'v') {
                object_ref = object_val;
                queue.unshift(['v', object_val[token]]);
            } else {
                throw "Token is not object: " + object_val; 
            }
        } else {
            queue.unshift([token_type, token]);
        }
    }

    if (queue.length == 1) {
        if (queue[0][0] == 'r') {
            return turtlegui.resolve_field(queue[0][1], rel_data, elem);
        } else {
            return queue[0][1];
        }
    } else {
        throw "Unexpected " + queue[1][1];
    }
}


turtlegui._lazy_tokenize = function(gres) {
    if (!turtlegui.cached_evaluations[gres]) {
        var tokens = turtlegui._token(gres);
        var shunted = turtlegui._shunt(tokens);
        turtlegui.cached_evaluations[gres] = shunted;
    }
    return turtlegui.cached_evaluations[gres];
}


turtlegui._evaluate_expression = function(gres, elem) {
    return turtlegui._reduce(turtlegui._lazy_tokenize(gres), elem);
}


turtlegui._shunt = function(tokens) {
    var precedence = ['||', '&&', '<', '>', '<=', '>=', '==', '-', '+', '*', '/', '!', '.', '(', '['];

    var operator_stack = [];
    var output_stack = [];

    // Shunting yard tokens into output stack
    // while there are tokens to be read:
    for (var i=0; i<tokens.length; i++) {
        // read a token.
        var token_type = tokens[i][0];
        var token = tokens[i][1];

        // if the token is a number, then:
        if ('brsncf'.indexOf(token_type) != -1) {
            // push it to the output queue.
            output_stack.push([token_type, token]);
        // else if the token is an operator then:
        } else if (token_type == 'o' || token_type == 'c' || token_type == '.') {
            // while ((there is an operator at the top of the operator stack)
                // and ((the operator at the top of the operator stack has greater precedence)
                    // or (the operator at the top of the operator stack has equal precedence and the token is left associative))
                // and (the operator at the top of the operator stack is not a left parenthesis)):
            while (operator_stack.length && operator_stack[0][1] != '(' && operator_stack[0][1] != '[' && precedence.indexOf(operator_stack[0][1]) > precedence.indexOf(token)) {
                // pop operators from the operator stack onto the output queue.
                output_stack.push(operator_stack.shift())
            }
            // push it onto the operator stack.
            operator_stack.unshift([token_type, token]);
        // else if the token is a left parenthesis (i.e. "("), then:
        } else if (token_type == 'O') {
            while (operator_stack.length && operator_stack[0][0] == '.') {
                // pop operators from the operator stack onto the output queue.
                output_stack.push(operator_stack.shift())
            }
            // push it onto the operator stack.
            operator_stack.unshift([token_type, token]);
            output_stack.push([token_type, token])
        // else if the token is a right parenthesis (i.e. ")"), then:
        } else if (token_type == 'B') {
            // while the operator at the top of the operator stack is not a left parenthesis:
            while (operator_stack.length && operator_stack[0][0] != 'O') {
                // pop the operator from the operator stack onto the output queue.
                output_stack.push(operator_stack.shift())
                // /* If the stack runs out without finding a left parenthesis, then there are mismatched parentheses. */
            }
            output_stack.push([token_type, token])
            // if there is a left parenthesis at the top of the operator stack, then:
            if (operator_stack.length && operator_stack[0][0] == 'O') {
                // pop the operator from the operator stack and discard it
                operator_stack.shift()
            }
        }
    }
    // /* After while loop, if operator stack not null, pop everything to output queue */
    // if there are no more tokens to read then:
    // while there are still operator tokens on the stack:
    while (operator_stack.length) {
        // /* If the operator token on the top of the stack is a parenthesis, then there are mismatched parentheses. */
        // pop the operator from the operator stack onto the output queue.
        output_stack.push(operator_stack.shift())
    }

    return output_stack;
}


turtlegui._relative_eval = function(elem, gres, error_str) {
    // Evaluates an expression using values stored directly in the DOM tree (i.e. 'item' from a list)
    // Will set any stored data as a global variable for the duration of the reload of the current element, then swap it back
    var rel = turtlegui.retrieve(elem, 'data-rel') || {};
    var switcharoo = {};
    for (var key=0; key<rel.length; key++) {
        if (key in window) {
            switcharoo[key] = window[key];
        }
        window[key] = rel[key];
    }
    try {
        return turtlegui._evaluate_expression(gres, elem);
    } catch(e) {
        try {
            turtlegui.log_error(error_str + '" on element ' + elem.nodeName + " : " + e, elem)
            if (e.stack) {
                turtlegui.log("Stacktrace: ", e.stack);
            } else {
                console.trace();
            }
        } catch (noconsole) {
            throw e;
        }
    } finally {
        for (var key=0; key<switcharoo.length; key++) {
            window[key] = switcharoo[key];
        }
    }
}


turtlegui._eval_attribute = function(elem, attribute) {
    var gres = elem.getAttribute(attribute);
    if (!gres) {
        return null;
    }
    var error_str = 'Error evaluating ' + attribute + '="' + gres;
    return turtlegui._relative_eval(elem, gres, error_str);
}


turtlegui.ajax = {
    http_call: function(method, url, data, success, error) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status >= 200 && this.status < 300) {
                    if (success) {
                        success(this.responseText, this);
                    }
                }
                else if (error) {
                    error(this);
                } else {
                    turtlegui.log("Error loading " + url + " - " + this.status + " " + this.statusText);
                }
            }
        };
        xmlhttp.open(method, url, true);
        if (data) {
            xmlhttp.setRequestHeader("Content-Type", "application/json; utf-8");
            xmlhttp.send(JSON.stringify(data));
        } else {
            xmlhttp.send();
        }
    },
    get: function(url, success, error) {
        turtlegui.ajax.http_call("GET", url, null, success, error);
    },
    post: function(url, data, success, error) {
        turtlegui.ajax.http_call("POST", url, data, success, error);
    },
    put: function(url, data, success, error) {
        turtlegui.ajax.http_call("PUT", url, data, success, error);
    },
    patch: function(url, data, success, error) {
        turtlegui.ajax.http_call("PATCH", url, data, success, error);
    },
    delete: function(url, success, error) {
        turtlegui.ajax.http_call("DELETE", url, null, success, error);
    }
}


turtlegui.load_snippet = function(elem, url, rel_data) {
    if (url in turtlegui.cached_snippets) {
        elem.innerHTML = turtlegui.cached_snippets[url];
        for (var c=0; c<elem.children.length; c++) {
            turtlegui._reload(elem, rel_data);
        }
    } else if (url in turtlegui.loading_snippets) {
        turtlegui.loading_snippets[url][turtlegui.loading_snippets[url].length] = {'elem': elem, 'rel_data': rel_data};
    } else if (!(url in turtlegui.loading_snippets)) {
        turtlegui.loading_snippets[url] = [{'elem': elem, 'rel_data': rel_data}];
        var nocache = elem.getAttribute('gui-include-nocache');

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {

                if (!nocache) {
                    turtlegui.cached_snippets[url] = this.responseText;
                }

                var snippets = turtlegui.loading_snippets[url];
                delete turtlegui.loading_snippets[url];

                for (var i=0; i<snippets.length; i++) {
                    var elem = snippets[i].elem;
                    var rel_data = snippets[i].rel_data;
                    elem.innerHTML = this.responseText;
                    for (var c=0; c<elem.children.length; c++) {
                        turtlegui._reload(elem.children[c], rel_data);
                    }
                }
            } else if (this.readyState == 4) {
                turtlegui.log("Could not load html snippet: " + url + " - " + this.status + " " + this.statusText);
            }
        };
        var load_url = url;
        if (nocache) {
            if (url.indexOf('?') != -1) {
                load_url = url + '&prevent_cache=' + new Date();
            } else {
                load_url = url + '?prevent_cache=' + new Date();
            }
        }
        xmlhttp.open("GET", load_url, true);
        xmlhttp.send();
    }
}


turtlegui.reload = function(elem, context) {

    if (!elem) {
        elem = turtlegui.root_element || document.body;
    }

    turtlegui._focused_element = null;

    function index(e) {
        var i = 0;
        while( (e = e.previousElementSibling) != null ) 
            i++;
        return i;
    }
    var path = [];
    if (document.activeElement.nodeName != 'BODY') {
        path = turtlegui.getstack(document.activeElement);
    }
    var path_indices = [];
    for (var i=0; i<path.length; i++) {
        path_indices[i] = index(path[i]);
    }
    turtlegui._reload(elem, context);
    var current_elem = document.body;
    for (var i=0; i<path_indices.length; i++) {
        current_elem = current_elem.children[path_indices[i]];
    }
    if (turtlegui._focused_element == null && current_elem && document.activeElement != current_elem) {
        current_elem.focus();
    } else if (turtlegui._focused_element != null && document.activeElement != turtlegui._focused_element) {
        turtlegui._focused_element.focus();
    }
}


turtlegui.deferred_reload = function(elem, callback) {
    setTimeout(function() {
        turtlegui.reload(elem);
        if (callback) {
            callback();
        }
    }, 0);
}


turtlegui._show_element = function(elem) {
    if (!turtlegui.retrieve(elem, 'data-elem-orig-display')) {
        turtlegui.store(elem, 'data-elem-orig-display', getComputedStyle(elem, null).display);
    }
    if (turtlegui.retrieve(elem, 'data-elem-shown') == 'false' || turtlegui.retrieve(elem, 'data-elem-shown') == null) {
        if (elem.getAttribute('gui-onshow')) {
            turtlegui._eval_attribute(elem, 'gui-onshow')
        } else {
            if (turtlegui.retrieve(elem, 'data-elem-orig-display') == 'none') {
                elem.style.display = 'block';
            } else {
                elem.style.display = turtlegui.retrieve(elem, 'data-elem-orig-display');
            }
        }
        turtlegui.store(elem, 'data-elem-shown', 'true');
    }
}


turtlegui._hide_element = function(elem) {
    if (!turtlegui.retrieve(elem, 'data-elem-orig-display')) {
        turtlegui.store(elem, 'data-elem-orig-display', getComputedStyle(elem, null).display);
    }
    if (turtlegui.retrieve(elem, 'data-elem-shown') == 'true' || turtlegui.retrieve(elem, 'data-elem-shown') == null) {
        if (elem.getAttribute('gui-onhide')) {
            turtlegui._eval_attribute(elem, 'gui-onhide')
        } else {
            elem.style.display = "none";
        }
        turtlegui.store(elem, 'data-elem-shown', 'false');
    }
}


turtlegui._parse_evaluate_semicolon_separated = function(expression) {
    if (!turtlegui.cached_evaluations[expression]) {
        var expression_map = {};

        var tokens = turtlegui._token(expression || '');

        while(tokens.length && tokens[0][1] == ';') { tokens.shift(); }
        while(tokens.length) {
            if (tokens[0][0] != 'r') { throw "Reference expected, found " + tokens[0][1]; }
            if (tokens[1][1] != '=') { throw "Expected assignment (=), found " + tokens[1][1]; }
            var field_name = tokens.shift()[1];
            // Pop equals
            tokens.shift();
            var expression = [];
            while (tokens.length && tokens[0][1] != ';') { expression.push(tokens.shift()); }
            expression_map[field_name] = turtlegui._shunt(expression);
            while(tokens.length && tokens[0][1] == ';') { tokens.shift(); }
        }
        turtlegui.cached_evaluations[expression] = expression_map;
    }
    return turtlegui.cached_evaluations[expression];
}


turtlegui._evaluate_semicolon_separated = function(elem, attribute_name) {
    var expression = elem.getAttribute(attribute_name);
    var expression_map = turtlegui._parse_evaluate_semicolon_separated(expression);
    var evaluated = {};
    for (var field_name in expression_map) {
        evaluated[field_name] = turtlegui._reduce(expression_map[field_name], elem);
    }
    return evaluated;
}

turtlegui._rebind = function(elem, event_id, func) {
    elem.removeEventListener(event_id, func);
    elem.addEventListener(event_id, func);
}

turtlegui._click_event_listener = function(e) {
    var elem = e.currentTarget;
    return turtlegui._eval_attribute(elem, 'gui-click');
}
turtlegui._bind_listener = function(e) {
    var elem = e.currentTarget;
    return turtlegui._eval_attribute(elem, 'gui-event');
}
turtlegui._bind_events_listener = function(e) {
    var elem = e.currentTarget;
    var event_map = turtlegui.retrieve(elem, '_event_map');
    return turtlegui._reduce(event_map[e.type], elem);
}

turtlegui._mouseover_listener = function(e) {
    var elem = e.currentTarget;
    return turtlegui._eval_attribute(elem, 'gui-mouseover');
}
turtlegui._mouseout_listener = function(e) {
    var elem = e.currentTarget;
    return turtlegui._eval_attribute(elem, 'gui-mouseout');
}
turtlegui._mousemove_listener = function(e) {
    var elem = e.currentTarget;
    return turtlegui._eval_attribute(elem, 'gui-mousemove');
}
turtlegui._keydown_listener = function(e) {
    var elem = e.currentTarget;
    return turtlegui._eval_attribute(elem, 'gui-keydown');
}
turtlegui._keyup_listener = function(e) {
    var elem = e.currentTarget;
    return turtlegui._eval_attribute(elem, 'gui-keyup');
}


turtlegui._reload = function(elem, rel_data) {
    if (!rel_data) rel_data = {};

    var old_rel_data = turtlegui.retrieve(elem, 'data-rel') || {};
    rel_data = Object.assign(old_rel_data, rel_data);
    turtlegui.store(elem, 'data-rel', rel_data);

    if (elem.getAttribute('gui-show')) {
        var value = turtlegui._eval_attribute(elem, 'gui-show');
        if (value) {
            turtlegui._show_element(elem);
        } else {
            turtlegui._hide_element(elem);
            if (elem.getAttribute('gui-id')) {
                elem.setAttribute('id', null);
            }
            return;
        }
    }
    if (elem.getAttribute('gui-attrs')) {
        var attrs = turtlegui._evaluate_semicolon_separated(elem, 'gui-attrs');
        for (var key in attrs) {
            elem.setAttribute(key, attrs[key]);
        }
    }
    if (elem.getAttribute('gui-data')) {
        var datas = turtlegui._evaluate_semicolon_separated(elem, 'gui-data');
        for (var key in datas) {
            turtlegui.store(elem, key, datas[key]);
        }
    }
    if (elem.getAttribute('gui-class')) {
        var orig_class = turtlegui.retrieve(elem, 'data-orig-class');
        if (!orig_class && elem.getAttribute('class')) {
            turtlegui.store(elem, 'data-orig-class', elem.getAttribute('class'));
            orig_class = elem.getAttribute('class');
        }
        var value = turtlegui._eval_attribute(elem, 'gui-class');
        elem.classList.value = (orig_class || '') + ' ' + (value || '');
    }
    if (elem.getAttribute('gui-css')) {
        var properties = turtlegui._eval_attribute(elem, 'gui-css');
        for (var p in properties) {
            elem.style[p] = properties[p];
        }
    }
    if (elem.getAttribute('gui-id')) {
        var orig_id = turtlegui.retrieve(elem, 'data-orig-id');
        if (!orig_id) {
            orig_id = elem.getAttribute('id') || '';
            turtlegui.store(elem, 'data-orig-id', orig_id);
        }
        var value = turtlegui._eval_attribute(elem, 'gui-id');
        elem.setAttribute('id', (orig_id == null ? '' : orig_id) + (value == null ? '' : value));
    }
    if (elem.getAttribute('gui-text')) {
        value = turtlegui._eval_attribute(elem, 'gui-text');
        elem.textContent = value;
    }
    if (elem.getAttribute('gui-html')) {
        value = turtlegui._eval_attribute(elem, 'gui-html');
        elem.innerHTML = value;
    }
    if (elem.getAttribute('gui-click')) {
        turtlegui._rebind(elem, 'click', turtlegui._click_event_listener);
    }
    if (elem.getAttribute('gui-bind') && elem.getAttribute('gui-event')) {
        turtlegui._rebind(elem, elem.getAttribute('gui-bind'), turtlegui._bind_listener);
    }

    if (elem.getAttribute('gui-bind-events')) {
        var expression = elem.getAttribute('gui-bind-events');
        var event_map = turtlegui._parse_evaluate_semicolon_separated(expression);

        turtlegui.store(elem, '_event_map', event_map);

        for (var event_id in event_map) {
            turtlegui._rebind(elem, event_id, turtlegui._bind_events_listener);
        }
    }
    if (elem.getAttribute('gui-mouseover')) {
        turtlegui._rebind(elem, 'mouseover', turtlegui._mouseover_listener);
    }
    if (elem.getAttribute('gui-mouseout')) {
        turtlegui._rebind(elem, 'mouseout', turtlegui._mouseout_listener);
    }
    if (elem.getAttribute('gui-mousemove')) {
        turtlegui._rebind(elem, 'mousemove', turtlegui._mousemove_listener);
    }
    if (elem.getAttribute('gui-keydown')) {
        turtlegui._rebind(elem, 'keydown', turtlegui._keydown_listener);
    }
    if (elem.getAttribute('gui-keyup')) {
        turtlegui._rebind(elem, 'keyup', turtlegui._keyup_listener);
    }
    if (elem.getAttribute('gui-focus')) {
        if (turtlegui._eval_attribute(elem, 'gui-focus')) {
            turtlegui._focused_element = elem;
        }
    }
    if (elem.getAttribute('gui-switch')) {
        var value = turtlegui._eval_attribute(elem, 'gui-switch');
        for (var i=0; i<elem.children.length; i++) {
            var child = elem.children[i];
            if (child.getAttribute('gui-case') && turtlegui._eval_attribute(child, 'gui-case') == value) {
                turtlegui._show_element(child);
                turtlegui._reload(child, rel_data);
            } else if (child.getAttribute('gui-case') == null) {
                turtlegui._reload(child, rel_data);
            } else {
                turtlegui._hide_element(child);
            }
        }
    }
    else if (elem.getAttribute('gui-list')) {
        var list = turtlegui._eval_attribute(elem, 'gui-list');
        if (!Array.isArray(list) && typeof(list) != 'string') {
            var rel_item = elem.getAttribute('gui-item');
            var rel_key = elem.getAttribute('gui-key');
            if (elem.getAttribute('gui-reversed')) {
                var rel_reverse = turtlegui._eval_attribute(elem, 'gui-reversed');
            } else {
                var rel_reverse = false;
            }

            var object_list = [];
            if (list) {
                var keys = Object.keys(list);
                for (var k=0; k<keys.length; k++) {
                    var key = keys[k];
                    if (elem.getAttribute('gui-ordering')) {
                        var rel = turtlegui.retrieve(elem, 'data-rel');
                        rel[rel_item] = list[key];
                        var order_key = turtlegui._eval_attribute(elem, 'gui-ordering');
                        object_list[object_list.length] = [order_key, key, list[key]];
                    } else {
                        object_list[object_list.length] = [key, key, list[key]];
                    }
                }
            }
            object_list.sort();
            if (rel_reverse) {
                object_list.reverse();
            }

            var orig_elems = [];
            for (var orig=0; orig<elem.children.length; orig++) {
                orig_elems[orig_elems.length] = elem.children[orig];
            }

            var template_elems;

            if (typeof(turtlegui.retrieve(elem, '_first_child')) == 'undefined') {
                template_elems = [];
                for (var orig=0; orig<orig_elems.length; orig++) {
                    template_elems[template_elems.length] = orig_elems[orig];
                }
                turtlegui.store(elem, '_first_child', template_elems);
            } else {
                template_elems = turtlegui.retrieve(elem, '_first_child');
            }

            for (var i=0; i<object_list.length; i++) {
                var obj_item = object_list[i];
                var obj_key = obj_item[1];
                var item = obj_item[2];

                var rel_data = Object.assign({}, rel_data);
                rel_data[rel_item] = item;
                if (rel_key != null) {
                    rel_data[rel_key] = obj_key;
                }

                for (var e=0; e<template_elems.length; e++) {
                    var new_elem = template_elems[e].cloneNode(true);

                    elem.append(new_elem);

                    turtlegui._show_element(new_elem);
                    turtlegui._reload(new_elem, rel_data);
                }
            }

            turtlegui.remove_elements(orig_elems);
        } else {
            var rel_item = elem.getAttribute('gui-item');
            var rel_key = elem.getAttribute('gui-key');
            var rel_order = elem.getAttribute('gui-ordering');
            var orig_elems = [];
            for (var orig=0; orig<elem.children.length; orig ++) {
                orig_elems[orig_elems.length] = elem.children[orig];
            }

            var template_elems;

            if (typeof(turtlegui.retrieve(elem, '_first_child')) == 'undefined') {
                template_elems = [];
                for (var orig=0; orig<orig_elems.length; orig++) {
                    template_elems[template_elems.length] = orig_elems[orig];
                }
                turtlegui.store(elem, '_first_child', template_elems);
            } else {
                template_elems = turtlegui.retrieve(elem, '_first_child');
            }

            if (rel_order) {
                ordered_list = [];
                for (var i=0; i<list.length; i++) {
                    ordered_list[i] = list[i];
                }
                function cmp(lhs, rhs) {
                    if (lhs[rel_order] == rhs[rel_order]) {
                        return 0;
                    }
                    else if (lhs[rel_order] > rhs[rel_order]) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                }
                ordered_list.sort(cmp);

                if (turtlegui._eval_attribute(elem, 'gui-reversed')) {
                    ordered_list.reverse();
                }

                list = ordered_list;
            }

            for (var i=0; i<list.length; i++) {
                var item = list[i];

                var rel_data = Object.assign({}, rel_data);
                rel_data[rel_item] = item;
                if (rel_key != null) {
                    rel_data[rel_key] = i;
                }

                for (var e=0; e<template_elems.length; e++) {
                    var new_elem = template_elems[e].cloneNode(true);

                    elem.append(new_elem);

                    turtlegui._show_element(new_elem);
                    turtlegui._reload(new_elem, rel_data);
                }
            }

            turtlegui.remove_elements(orig_elems);
        }
    }
    else if (elem.getAttribute('gui-tree')) {
        var tree = turtlegui._eval_attribute(elem, 'gui-tree');
        var rel_item = elem.getAttribute('gui-nodeitem');

        var orig_elems = [];
        for (var orig=0; orig<elem.children.length; orig++) {
            orig_elems[orig_elems.length] = elem.children[orig];
        }

        var first_elem;

        if (typeof(turtlegui.retrieve(elem, '_first_child')) == 'undefined') {
            first_elem = orig_elems[0];
            turtlegui.store(elem, '_first_child', first_elem);
        } else {
            first_elem = turtlegui.retrieve(elem, '_first_child');
        }

        var rel_data = Object.assign({}, rel_data);
        rel_data[rel_item] = tree;
        rel_data['_last_tree_elem'] = first_elem;
        rel_data['_last_tree_item'] = rel_item;
         
        var new_elem = first_elem.cloneNode(true);
        elem.append(new_elem);
        turtlegui._show_element(new_elem);
        turtlegui._reload(new_elem, rel_data);

        turtlegui.remove_elements(orig_elems);
    }
    else if (elem.getAttribute('gui-node')) {
        var node = turtlegui._eval_attribute(elem, 'gui-node');

        var orig_elems = [];
        for (var orig=0; orig<elem.children.length; orig++) {
            orig_elems[orig_elems.length] = elem.children[orig];
        }

        var first_elem = rel_data['_last_tree_elem'];
        var rel_data = Object.assign({}, rel_data);
        rel_data[rel_item] = node;
        rel_data[rel_data['_last_tree_item']] = node;
 
        var new_elem = first_elem.cloneNode(true);
        elem.append(new_elem);
        turtlegui._show_element(new_elem);
        turtlegui._reload(new_elem, rel_data);

        turtlegui.remove_elements(orig_elems);
    }
    else if (elem.getAttribute('gui-include') && !turtlegui.retrieve(elem, 'gui-included')) {
        turtlegui.store(elem, 'gui-included', true);
        var url = elem.getAttribute('gui-include');
        if (url != null) {
            var params = turtlegui._evaluate_semicolon_separated(elem, 'gui-include-params');

            var rel_data = Object.assign(params, rel_data);
            turtlegui.load_snippet(elem, url, rel_data);
        }
    }
    else if (elem.getAttribute('gui-include') && turtlegui.retrieve(elem, 'gui-included')) {
        var params = turtlegui._evaluate_semicolon_separated(elem, 'gui-include-params');

        var rel_data = Object.assign(params, rel_data);
        for (var c=0; c<elem.children.length; c++) {
            turtlegui._reload(elem.children[c], rel_data);
        }
    }
    else if (!elem.getAttribute('gui-reload')) {
        for (var c=0; c<elem.children.length; c++) {
            turtlegui._reload(elem.children[c], rel_data);
        }
    }

    if (elem.getAttribute('gui-val')) {
        var obj_ref = turtlegui._eval_attribute(elem, 'gui-val');
        var value = obj_ref;
        if (typeof(obj_ref) == 'function') {
            value = obj_ref();
        }
        if (elem.type == 'checkbox' || elem.type == 'radio') {
            if (value) {
                elem.checked = true;
            } else {
                elem.checked = false;
            }
        } else {
            if (elem.getAttribute('gui-format-func')) {
                if (value != null) {
                    value = turtlegui._eval_attribute(elem, 'gui-format-func')(value);
                }
            }
            if (value == null) {
                elem.value = '';
            } else {
                elem.value = value;
            }
        }
        turtlegui._rebind(elem, 'change', turtlegui._val_change);
    }
    if (elem.getAttribute('gui-change')) {
        turtlegui._rebind(elem, 'change', turtlegui._change_listener);
    }

    if (elem.getAttribute('gui-reload')) {
        turtlegui._eval_attribute(elem, 'gui-reload')
    }
}


turtlegui._val_change = function(e) {
    var elem = e.currentTarget;
    turtlegui.val_changed(elem);
}


turtlegui.val_changed = function(elem) {
    var gres = elem.getAttribute('gui-val');

    if (elem.type == 'checkbox' || elem.type == 'radio') {
        var elem_val = elem.checked;
    } else {
        var elem_val = elem.value;
    }

    if (elem_val != null && elem.getAttribute('gui-parse-func')) {
        elem_val = turtlegui._eval_attribute(elem, 'gui-parse-func')(elem_val);
    }

    var shunted = turtlegui._lazy_tokenize(gres);

    if (shunted[shunted.length-1][1] == ']') {
        // Object syntax

        // search for opening bracket
        var key_tokens = [];
        var i = shunted.length - 2;
        for (; i > 0 && shunted[i][1] != '['; i--) { key_tokens.unshift(shunted[i]); }
        // reduce key_name
        var key_name = turtlegui._reduce(key_tokens, elem);
        // reduce ref before opening bracket
        var object_tokens = [];
        for (i -= 1; i >= 0; i--) { object_tokens.unshift(shunted[i]); }
        var object_ref = turtlegui._reduce(object_tokens, elem);
        // set value
        object_ref[key_name] = elem_val;

    } else if (shunted[shunted.length-1][1] == ')') {
        // Function syntax

        // inject extra parameter
        if (shunted[shunted.length-2][1] == '(') {
            shunted.splice(shunted.length-1, 0, ['v', elem_val]);
        } else {
            shunted.splice(shunted.length-1, 0, [',', ',']);
            shunted.splice(shunted.length-1, 0, ['v', elem_val]);
        }
        // apply function
        turtlegui._reduce(shunted, elem);
    } else if (shunted[shunted.length-1][0] == 'f') {
        // dot notation syntax

        var field_name = shunted[shunted.length-1][1];
        shunted = shunted.slice(0, shunted.length-1);
        var object_ref = turtlegui._reduce(shunted, elem);
        // Apply value
        object_ref[field_name] = elem_val;
    }
}

turtlegui._change_listener = function(e) {
    var elem = e.currentTarget;
    turtlegui._eval_attribute(elem, 'gui-change');
}

