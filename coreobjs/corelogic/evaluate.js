var TapDigit;
TapDigit = TapDigit || {};
TapDigit.Token = {
    Operator: 'Operator',
    Identifier: 'Identifier',
    Number: 'Number'
};
var TapUtil;
TapUtil = TapUtil || {};


/*global TapDigit:true */
var util;

var exports = module.exports = {};

exports.parseEquation = function (equation, datarules, usecase) {

    try {
        util = new TapUtil.Util();
        //util.setPrimes();

        let evObj = new TapDigit.Evaluator();
        evObj.evaluate(equation, datarules, usecase);
        let ctxData = evObj.data();
        let results = evObj.results();
        console.log('Result: ' + JSON.stringify(results));
        console.log('ctxData: ' + JSON.stringify(ctxData));
        this.evda = ctxData;
        this.ans = results.main.Result;
        // call if needed from the server.js
        // this.mtch = util.getRandomChoices(this.ans,datarules);
    } catch (e) {
        console.log('Error: ' + e.toString());
        throw e;
    }

};

exports.getChoices = function (ans, datarules) {
    try {
        util = new TapUtil.Util();
        this.mtch = util.getRandomChoices(ans, datarules);
    } catch (e) {
        console.log('Error: ' + e.toString());
        throw e;
    }
};

//module.exports = parseEquation;


///////////////////////////ONLY COPT THIS BELOW ONE FOR CHANGES////////////////////////////
///////////////////////////////////////////////////////
TapDigit.Evaluator = function (ctx) {
    let parser = new TapDigit.Parser(),
        context = (arguments.length < 1) ? new TapDigit.Context() : ctx;
    let fracobj = new TapDigit.Fractions(context);
    //let stepResults = new Array();
    //let stepTokens = new Array();
    let datarules;
    let usecase;
    let condexps; //globalvariable
    let resultobj = {};
    let tokenobj = {};
    context.Variables = {};

    //used to determine which one tried and changed, so that they will not be tried again
    //variable divison and subtraction to control the result type of the data such as proper numbers and positive/negative
    context.VarDiv = {};
    context.VarSub = {};

    let ctxVarsCur = [];
    let ctxRunCond = false;

    //created to determine the context variables

    function execVars(node) {
        let left, right, expr, args;
        if (node.hasOwnProperty('Expression')) {
            return execVars(node.Expression);
        }

        if (node.hasOwnProperty('Number')) {
            if (node.Number.indexOf("f") >= 0) {
                return node.Number;
            }
            return parseFloat(node.Number);
            // return parseFloat(node.Number);
        }

        if (node.hasOwnProperty('Binary')) {
            node = node.Binary;
            left = execVars(node.left);
            right = execVars(node.right);
            switch (node.operator) {
                case '>':
                    return 1;
                case '+':
                    return left + right;
                case '-':
                    return left - right;
                case '*':
                    return left * right;
                case '/':
                    return left / right;
                default:
                    throw new SyntaxError('Unknown operator ' + node.operator);
            }
        }
        if (node.hasOwnProperty('Unary')) {
            node = node.Unary;
            expr = execVars(node.expression);
            switch (node.operator) {
                case '+':
                    return expr;
                case '-':
                    return -expr;
                default:
                    throw new SyntaxError('Unknown operator ' + node.operator);
            }
        }

        if (node.hasOwnProperty('Identifier')) {
            if (context.Constants.hasOwnProperty(node.Identifier)) {
                return context.Constants[node.Identifier];
            }
            if (context.Variables.hasOwnProperty(node.Identifier)) {
                ctxVarsCur.push(node.Identifier);
                return context.Variables[node.Identifier];
            }
            else { //it never execute this
                //console.log("context.datarules.." + JSON.stringify(datarules[node.Identifier]));
                context.Variables[node.Identifier] = util.getRandomByRules(datarules[node.Identifier])
                // context.Variables[node.Identifier] = util.getFromShuffle(node.Identifier);
                //console.log("context.Variables.." + JSON.stringify(context.Variables));
                return context.Variables[node.Identifier];

            }
            //throw new SyntaxError('Unknown identifier');
        }
        if (node.hasOwnProperty('Assignment')) {
            right = execVars(node.Assignment.value);
            context.Variables[node.Assignment.name.Identifier] = right;
            return right;
        }

        if (node.hasOwnProperty('FunctionCall')) {
            expr = node.FunctionCall;
            if (context.Functions.hasOwnProperty(expr.name)) {
                console.log('node FunctionCall:' + expr.name + "args.length:" + expr.args.length)
                args = [];
                for (let i = 0; i < expr.args.length; i += 1) {
                    args.push(exec(expr.args[i]));
                }
                return context.Functions[expr.name].apply(null, args);
            }
            throw new SyntaxError('Unknown function ' + expr.name);
        }
        throw new SyntaxError('Unknown syntax node');
    }

    function exec(node) {
        //console.log("executing.node.." + JSON.stringify(node));
        let left, right, expr, args;
        if (node.hasOwnProperty('Expression')) {
            return exec(node.Expression);
        }

        if (node.hasOwnProperty('Number')) {
            //console.log("executing.node.Number." + JSON.stringify(`node));
            if (node.Number.indexOf("f") >= 0 || node.Number.indexOf("m") >= 0) {
                return node.Number;
            }
            return node.Number;
        }

        if (node.hasOwnProperty('Binary')) {
            node = node.Binary;
            // console.log("executing.node.left." + JSON.stringify(node));
            left = exec(node.left);
            // console.log("executing.node.right." + JSON.stringify(node));
            right = exec(node.right);
            switch (node.operator) {
                case '>': {
                    //if false change the context until the values are true;
                    if (parseFloat(left) > parseFloat(right))
                        return 1;
                    else {
                        if (ctxRunCond) {
                            execVars(node.left);
                            let ctxVarsCurLeft = JSON.parse(JSON.stringify(ctxVarsCur));
                            ctxVarsCur = [];
                            execVars(node.right);
                            let ctxVarsCurRight = JSON.parse(JSON.stringify(ctxVarsCur));
                            let swap;
                            swap = context.Variables[ctxVarsCurLeft[0]];
                            context.Variables[ctxVarsCurLeft[0]] = context.Variables[ctxVarsCurRight[0]];
                            context.Variables[ctxVarsCurRight[0]] = swap;
                            //change which are in left and right
                            ctxRunCond = false;
                            return 1;
                        }
                    }
                }

                case ':':
                    //if (left.toString() == "0") {
                    //   return right.toString();
                    // }
                    //else {
                    //the first token  is a Number
                    if (isNaN(right) && right == "--")    //seperator
                        return "";
                    else
                        return left.toString() + "__" + right.toString();
                // }

                case '+':
                    if (left.toString().indexOf("f") >= 0 || right.toString().indexOf("f") >= 0 ||
                        left.toString().indexOf("m") >= 0 || right.toString().indexOf("m") >= 0) {
                        return fracobj.performFracOp(left.toString(), right.toString(), '+')
                    }
                    else {
                        let dcntleft = util.countDecimals(left);
                        let dcntright = util.countDecimals(right);
                        //one of them are decimal
                        if (dcntleft > 0 || dcntright > 0) {
                            let rslt = Number(left) + Number(right);
                            if (String(rslt).split(".").length > 1 && String(rslt).split(".")[1].length > 2) {
                                let dcnt = String(rslt).split(".")[1].length;
                                rslt = Number(Math.round(rslt + 'e' + dcnt) + 'e-' + dcnt).toFixed(2)
                            }
                            else if (String(rslt).split(".").length < 2 || String(rslt).split(".")[1].length <= 2) {
                                rslt = Number(rslt).toFixed(2)
                            }
                            return rslt;
                        }
                        else {
                            return Number(left) + Number(right);
                        }
                    }
                case '-':
                    if (left.toString().indexOf("f") >= 0 || right.toString().indexOf("f") >= 0 ||
                        left.toString().indexOf("m") >= 0 || right.toString().indexOf("m") >= 0) {
                        return fracobj.performFracOp(left.toString(), right.toString(), '-')
                    }
                    else {
                        //run conditions
                        if (condexps.StepExpressions.length == 0) {
                            let dcntleft = util.countDecimals(left);
                            let dcntright = util.countDecimals(right);
                            //one of them are decimal
                            if (dcntleft > 0 || dcntright > 0) {
                                let rslt = Number(left) - Number(right);
                                if (String(rslt).split(".").length > 1 && String(rslt).split(".")[1].length > 2) {
                                    let dcnt = String(rslt).split(".")[1].length;
                                    rslt = Number(Math.round(rslt + 'e' + dcnt) + 'e-' + dcnt).toFixed(2)
                                }
                                else if (String(rslt).split(".").length < 2 || String(rslt).split(".")[1].length <= 2) {
                                    rslt = Number(rslt).toFixed(2)
                                }
                                return rslt;
                            }
                            else {
                                return Number(left) - Number(right);
                            }
                        }

                        //TODO changes need for decimal...
                        let ctxVarsCurLeft, ctxVarsCurRight
                        ctxVarsCur = [];
                        execVars(node.left);
                        ctxVarsCurLeft = JSON.parse(JSON.stringify(ctxVarsCur));
                        ctxVarsCur = [];
                        execVars(node.right);
                        ctxVarsCurRight = JSON.parse(JSON.stringify(ctxVarsCur));

                        for (let i = 0; i < condexps.StepExpressions.length; i++) {
                            if (condexps.StepExpressions[i].Expression.FunctionCall.args[0].Binary.operator == ">") {
                                if (condexps.StepExpressions[i].Expression.FunctionCall.args[0].Binary.left.Identifier == ctxVarsCurLeft[0] &&
                                    condexps.StepExpressions[i].Expression.FunctionCall.args[0].Binary.right.Identifier == ctxVarsCurRight[0]) {
                                    if (parseFloat(left) - parseFloat(right) < 0) {
                                        let swap;
                                        swap = context.Variables[ctxVarsCurLeft[0]];
                                        context.Variables[ctxVarsCurLeft[0]] = context.Variables[ctxVarsCurRight[0]];
                                        context.Variables[ctxVarsCurRight[0]] = swap;
                                        return parseFloat(right) - parseFloat(left);
                                    }
                                    else {
                                        return parseFloat(left) - parseFloat(right);
                                    }
                                }
                            }
                        }
                    }
                case '*':
                    if (right == 0 || left == 0) return 0;
                    if (left.toString().indexOf("f") >= 0 || right.toString().indexOf("f") >= 0 ||
                        left.toString().indexOf("m") >= 0 || right.toString().indexOf("m") >= 0) {
                        let val = fracobj.performFracOp(left.toString(), right.toString(), '*')
                        return val;
                    }
                    else {
                        let dcntleft = util.countDecimals(left);
                        let dcntright = util.countDecimals(right);
                        //one of them are decimal
                        if (dcntleft > 0 || dcntright > 0) {
                            let rslt = Number(left) * Number(right);
                            if (String(rslt).split(".").length > 1 && String(rslt).split(".")[1].length > 2) {
                                let dcnt = String(rslt).split(".")[1].length;
                                rslt = Number(Math.round(rslt + 'e' + dcnt) + 'e-' + dcnt).toFixed(2)
                            }
                            else if (String(rslt).split(".").length < 2 || String(rslt).split(".")[1].length <= 2) {
                                rslt = Number(rslt).toFixed(2)
                            }
                            return rslt;
                        }
                        else {
                            return Number(left) * Number(right);
                        }
                    }
                // return parseFloat(left) * parseFloat(right);
                // case '*':
                //     return left * right;

                case '/': {
                    //as per the options
                    //if the numbers are decimal convert them to proper numbers and
                    //divide the 
                    if (left.toString().indexOf("f") >= 0 || right.toString().indexOf("f") >= 0 ||
                        left.toString().indexOf("m") >= 0 || right.toString().indexOf("m") >= 0) {
                        //console.log("left:" + left);
                        //console.log("right:" + right);
                        let val = fracobj.performFracOp(left.toString(), right.toString(), '/')

                        // let val = left * right;
                        ///console.log("val:" + val);
                        return val;
                    }

                    let dcntleft = util.countDecimals(left);
                    let dcntright = util.countDecimals(right);

                    let dmfactor = 1;
                    //one of them are decimal
                    if (dcntleft > 0 || dcntright > 0) {
                        //do the real numbers divison
                        //change to non decimal

                        if (dcntleft > 0 || dcntright > 0) {
                            if (dcntleft > dcntright) {
                                dmfactor = Math.pow(10, dcntleft);
                            }
                            else {
                                dmfactor = Math.pow(10, dcntright);
                            }
                        }


                        left = Number(left) * dmfactor;
                        right = Number(right) * dmfactor;

                        //change the context and rng mulity with dmfactor
                        if (left % right == 0) {
                            return performDivison(left, right, dmfactor);
                        }

                        console.log("contextVars Before:" + JSON.stringify(context.Variables));
                        //copy the context and recopy back
                        let currentContext = JSON.parse(JSON.stringify(context.Variables));

                        //console.log("contextVars Before:" + JSON.stringify(context.Variables));

                        //change the data range
                        let currentDatarules = {};

                        let ctxVarsCurLeft;
                        let ctxVarsCurRight;
                        ctxVarsCur = [];    //global variable
                        execVars(node.left);
                        ctxVarsCurLeft = JSON.parse(JSON.stringify(ctxVarsCur));
                        ctxVarsCur = [];
                        execVars(node.right);
                        ctxVarsCurRight = JSON.parse(JSON.stringify(ctxVarsCur));

                        /*
                                                for (let i = 0; i < ctxVarsCurLeft.length; i++) {
                                                    if (datarules[ctxVarsCurLeft[i]] && datarules[ctxVarsCurLeft[i]].rng) {
                                                        currentDatarules[ctxVarsCurLeft[i]] = JSON.parse(JSON.stringify(datarules[ctxVarsCurLeft[i]]));
                                                    }
                                                }
                        
                        
                                                for (let i = 0; i < ctxVarsCurRight.length; i++) {
                                                    if (datarules[ctxVarsCurRight[i]] && datarules[ctxVarsCurRight[i]].rng) {
                                                        currentDatarules[ctxVarsCurRight[i]] = JSON.parse(JSON.stringify(datarules[ctxVarsCurRight[i]]));
                                                    }
                                                }
                                                */

                        // changeDatarules(ctxVarsCurLeft, ctxVarsCurRight);

                        //multiply all the factors

                        let isDivisable = getDivisable(node, left, right, dmfactor)

                        /*
                                                for (let i = 0; i < ctxVarsCurLeft.length; i++) {
                                                    if (currentDatarules[ctxVarsCurLeft[i]] && currentDatarules[ctxVarsCurLeft[i]].rng) {
                                                        datarules[ctxVarsCurLeft[i]] = JSON.parse(JSON.stringify(currentDatarules[ctxVarsCurLeft[i]]));
                                                    }
                                                }
                        
                        
                                                for (let i = 0; i < ctxVarsCurRight.length; i++) {
                                                    if (currentDatarules[ctxVarsCurRight[i]] && currentDatarules[ctxVarsCurRight[i]].rng) {
                                                        datarules[ctxVarsCurRight[i]] = JSON.parse(JSON.stringify(currentDatarules[ctxVarsCurRight[i]]));
                                                    }
                                                }
                                                */

                        if (!isDivisable) {
                            context.Variables = JSON.parse(JSON.stringify(currentContext));
                            console.log("Divisable false..contextVars Same as Before:" + JSON.stringify(context.Variables));
                            return performDivison(left, right, dmfactor);
                        }

                        //if (isDivisable) {  //difficult to match TODO long future
                        //      left = exec(node.left) * dmfactor;
                        //     right = exec(node.right) * dmfactor;

                        for (let i = 0; i < ctxVarsCurLeft.length; i++) {
                            if (context.Variables[ctxVarsCurLeft[i]]) {
                                context.Variables[ctxVarsCurLeft[i]] = context.Variables[ctxVarsCurLeft[i]].toFixed(dmfactor.toString().length - 1);
                            }
                        }


                        for (let i = 0; i < ctxVarsCurRight.length; i++) {
                            if (context.Variables[ctxVarsCurRight[i]]) {
                                context.Variables[ctxVarsCurRight[i]] = context.Variables[ctxVarsCurRight[i]].toFixed(dmfactor.toString().length - 1);
                            }
                        }

                        //    return performDivison(left, right,dmfactor);
                        //}

                        if (isDivisable) {
                            console.log("Divisiable true..contextVars After:" + JSON.stringify(context.Variables));

                            //if the same context variables are responsible for the division which are already verified should not reRun
                            //looping the main result is wrong. this check is needed.
                            //required to reevaluate the step expression
                            console.log("************Reevaluating the expression******************:");
                            throw new Error("ContextChanged");
                        }
                    }

                    if (left % right == 0) {
                        return performDivison(left, right, dmfactor);
                    }

                    console.log("contextVars Before:" + JSON.stringify(context.Variables));
                    //copy the context and recopy back
                    let currentContext = JSON.parse(JSON.stringify(context.Variables));

                    let isDivisable = getDivisable(node, left, right, dmfactor);

                    if (!isDivisable) {
                        //keep the same context as original
                        //left and right values stay same

                        //note which context variables are tried for the divison
                        //TODO long future should note which operations (a/b) (c/b) they changed
                        context.Variables = JSON.parse(JSON.stringify(currentContext));
                        console.log("Divisable false..contextVars Same as Before:" + JSON.stringify(context.Variables));
                        return performDivison(left, right, dmfactor);
                    }

                    if (isDivisable) {
                        console.log("Divisiable true..contextVars After:" + JSON.stringify(context.Variables));

                        //if the same context variables are responsible for the division which are already verified should not reRun
                        //looping the main result is wrong. this check is needed.
                        //required to reevaluate the step expression
                        console.log("************Reevaluating the expression******************:");
                        throw new Error("ContextChanged");
                    }
                }
                default:
                    throw new SyntaxError('Unknown operator ' + node.operator);
            }
        }

        if (node.hasOwnProperty('Unary')) {
            node = node.Unary;
            expr = exec(node.expression);
            switch (node.operator) {
                case '+':
                    return expr;
                case '-':
                    return -expr;
                default:
                    throw new SyntaxError('Unknown operator ' + node.operator);
            }
        }

        if (node.hasOwnProperty('String')) {
            return node.String.slice(1, -1);
        }

        if (node.hasOwnProperty('Identifier')) {
            if (context.Constants.hasOwnProperty(node.Identifier)) {
                return context.Constants[node.Identifier];
            }

            if (context.Variables.hasOwnProperty(node.Identifier)) {
                return context.Variables[node.Identifier];
            }
            else {
                //set the random values for each identifier
                //check the condition, range, fixed, compare
                // context.Variables[node.Identifier] = util.getRandom(1, 99);

                //console.log("context.datarules.." + JSON.stringify(datarules[node.Identifier]));
                //split the idntifier if it contains 
                if (node.Identifier.indexOf("_m_") >= 0) {
                    let ciden;
                    if (node.Identifier.indexOf("c_") >= 0) { //first digit is constant
                        ciden = node.Identifier.split("c_")[1];
                    }
                    else {
                        ciden = node.Identifier;
                    }
                    let valm1 = ciden.split("_m_")[0];
                    let valf2 = ciden.split("_m_")[1];
                    let mfres = "";
                    if (isNaN(valm1)) {
                        if (!context.Variables.hasOwnProperty(valm1)) {
                            context.Variables[valm1] = util.getRandomByRules(datarules[valm1]);
                        }
                        mfres = "" + context.Variables[valm1];
                    }
                    else {
                        mfres = "" + valm1;
                    }
                    mfres = mfres + "m";
                    let fres = process_f(valf2);
                    mfres = mfres + fres;
                    context.Variables[node.Identifier] = mfres;
                    return mfres;
                }
                else if (node.Identifier.indexOf("_f_") >= 0) {
                    return process_f(node.Identifier);
                }
                else if (node.Identifier.indexOf("c_") >= 0) {
                    context.Variables[node.Identifier] = node.Identifier.split("c_")[1];
                    return context.Variables[node.Identifier];
                }
                else {
                    context.Variables[node.Identifier] = util.getRandomByRules(datarules[node.Identifier])
                    // context.Variables[node.Identifier] = util.getFromShuffle(node.Identifier);
                    //   console.log("context.Variables.." + JSON.stringify(context.Variables));
                    return context.Variables[node.Identifier];
                }

            }
            //throw new SyntaxError('Unknown identifier');
        }
        if (node.hasOwnProperty('Assignment')) {
            right = exec(node.Assignment.value);
            context.Variables[node.Assignment.name.Identifier] = right;
            return right;
        }

        if (node.hasOwnProperty('FunctionCall')) {
            expr = node.FunctionCall;
            //already exists in the contextvariables return it
            //because it is already processed

            console.log("FunctionCall expr is " + JSON.stringify(expr));
            if (context.Variables[expr.name]) { //this is for only functions start with name step
                console.log("returning the already evaluated value of " + expr.name + " which is " + context.Variables[expr.name]);
                return context.Variables[expr.name];
            }

            if (context.Functions.hasOwnProperty(expr.name)) {
                if (expr.name == "cond") ctxRunCond = true;
                console.log('node FunctionCall:' + expr.name + "args.length:" + expr.args.length)
                args = [];
                for (let i = 0; i < expr.args.length; i += 1) {
                    //    console.log("args[" + i + "]:" + expr.args[i]);
                    args.push(exec(expr.args[i]));
                }
                return context.Functions[expr.name].apply(null, args);
            }
            throw new SyntaxError('Unknown function ' + expr.name);
        }
        throw new SyntaxError('Unknown syntax node');
    }

    function performDivison(left, right, dmfactor) {

        /*
        let rslt = Number(left) / Number(right);
        if (String(rslt).split(".").length > 1) {
            let dcnt = String(rslt).split(".")[1].length;
            rslt = Number(Math.round(rslt + 'e' + dcnt) + 'e-' + dcnt).toFixed(2)
            return rslt;
        }
        else {
            return rslt;
        }
       */

        //change every thing to whole numbers
        let rslt = Number(left) / Number(right);
        if (String(rslt).split(".").length > 1 && String(rslt).split(".")[1].length > 2) {
            let dcnt = String(rslt).split(".")[1].length;
            rslt = Number(Math.round(rslt + 'e' + dcnt) + 'e-' + dcnt).toFixed(2)
        }
        // else if (String(rslt).split(".").length < 2 || String(rslt).split(".")[1].length <= 2) {
        //     rslt = Number(rslt).toFixed(2)
        // }
        else if (dmfactor > 1) {
            rslt = Number(rslt).toFixed(2)
        }
        return rslt;

    }

    function getContextVars() {


    }

    function changeDatarules(ctxVarsCurLeft, ctxVarsCurRight) {
        for (let i = 0; i < ctxVarsCurLeft.length; i++) {
            if (datarules[ctxVarsCurLeft[i]] && datarules[ctxVarsCurLeft[i]].rng) {
                ///////////////////
                let dcntmin = util.countDecimals(datarules[ctxVarsCurLeft[i]].rng[0]);
                let dcntmax = util.countDecimals(datarules[ctxVarsCurLeft[i]].rng[1]);
                let dmfactmm = 0;

                if (dcntmin > 0 || dcntmax > 0) {
                    if (dcntmax > dcntmin) {
                        dmfactmm = Math.pow(10, dcntmax);
                    }
                    else {
                        dmfactmm = Math.pow(10, dcntmin);
                    }
                }

                if (dmfactmm != 0) {
                    datarules[ctxVarsCurLeft[i]].rng[0] = Number(datarules[ctxVarsCurLeft[i]].rng[0]) * dmfactmm;
                    datarules[ctxVarsCurLeft[i]].rng[1] = Number(datarules[ctxVarsCurLeft[i]].rng[1]) * dmfactmm;
                }
                //////////////////
            }
        }

        for (let i = 0; i < ctxVarsCurRight.length; i++) {
            if (datarules[ctxVarsCurRight[i]] && datarules[ctxVarsCurRight[i]].rng) {
                ///////////////////
                let dcntmin = util.countDecimals(datarules[ctxVarsCurRight[i]].rng[0]);
                let dcntmax = util.countDecimals(datarules[ctxVarsCurRight[i]].rng[1]);
                let dmfactmm = 0;

                if (dcntmin > 0 || dcntmax > 0) {
                    if (dcntmax > dcntmin) {
                        dmfactmm = Math.pow(10, dcntmax);
                    }
                    else {
                        dmfactmm = Math.pow(10, dcntmin);
                    }
                }

                if (dmfactmm != 0) {
                    datarules[ctxVarsCurRight[i]].rng[0] = Number(datarules[ctxVarsCurRight[i]].rng[0]) * dmfactmm;
                    datarules[ctxVarsCurRight[i]].rng[1] = Number(datarules[ctxVarsCurRight[i]].rng[1]) * dmfactmm;
                }
                //////////////////
            }
        }
    }

    function getDivisable(node, left, right, dmfactor) {

        left = parseFloat(left);
        right = parseFloat(right);

        let isDivisable;
        let ctxVarsCurLeft;
        let ctxVarsCurRight;
        let ctxVarsCommon;
        let ctxVarsCommonEqn;
        isDivisable = false;
        ctxVarsCur = [];    //global variable
        execVars(node.left);
        ctxVarsCurLeft = JSON.parse(JSON.stringify(ctxVarsCur));
        ctxVarsCur = [];
        execVars(node.right);
        ctxVarsCurRight = JSON.parse(JSON.stringify(ctxVarsCur));
        //change which are in left and right
        ctxVarsCommon = [];
        for (let i = 0; i < ctxVarsCurLeft.length; i++) {
            for (let j = 0; j < ctxVarsCurRight.length; j++) {
                if (!(ctxVarsCurLeft[i].indexOf("step") >= 0)) {
                    if (ctxVarsCurLeft[i] == ctxVarsCurRight[j]) {
                        ctxVarsCommon.push(ctxVarsCurLeft[i]);
                    }
                }
            }
        }

        let ctxVarsCurLeftOnly;
        let ctxVarsCurRightOnly;
        ctxVarsCurLeftOnly = [];
        let isExists = true;
        for (let i = 0; i < ctxVarsCurLeft.length; i++) {
            isExists = false;
            for (let k = 0; k < ctxVarsCommon.length; k++) {
                if (ctxVarsCurLeft[i] == ctxVarsCommon[k])
                    isExists = true;
            }
            if (!isExists) {
                if (!(ctxVarsCurLeft[i].indexOf("step") >= 0)) {
                    ctxVarsCurLeftOnly.push(ctxVarsCurLeft[i]);
                }
            }
        }

        ctxVarsCurRightOnly = [];
        for (let j = 0; j < ctxVarsCurRight.length; j++) {
            isExists = false;
            for (let k = 0; k < ctxVarsCommon.length; k++) {
                if (ctxVarsCurRight[j] == ctxVarsCommon[k])
                    isExists = true;
            }
            if (!isExists) {
                if (!(ctxVarsCurRight[j].indexOf("step") >= 0)) {
                    ctxVarsCurRightOnly.push(ctxVarsCurRight[j]);
                }
            }
        }


        ////////////////////////////////////COMMON C O M M O N V A R I A B L E S/////////////
        if (!isDivisable) {
            console.log("ctxVarsCommon:" + JSON.stringify(ctxVarsCommon));
            for (let i = 0; i < ctxVarsCommon.length; i++) {
                if (!(ctxVarsCommon[i].indexOf("step") >= 0)) {
                    isDivisable = process_variable(node, ctxVarsCommon[i], dmfactor);
                    if (isDivisable) {
                        break;
                    }
                }
            }
        }

        ///////////////////////////////// LEFT and RIGHT  V A R I A B L E S//////////////////////////////////////////////////
        if (ctxVarsCurRightOnly.length < ctxVarsCurLeftOnly.length) {
            if (!isDivisable) {
                for (let i = 0; i < ctxVarsCurRightOnly.length; i++) {
                    isDivisable = process_variable(node, ctxVarsCurRightOnly[i], dmfactor);
                    if (isDivisable) {
                        break;
                    }
                }
            }

            if (!isDivisable) {
                for (let i = 0; i < ctxVarsCurLeftOnly.length; i++) {
                    isDivisable = process_variable(node, ctxVarsCurLeftOnly[i], dmfactor);
                    if (isDivisable) {
                        break;
                    }
                }
            }
        }
        else {

            if (!isDivisable) {
                for (let i = 0; i < ctxVarsCurLeftOnly.length; i++) {
                    isDivisable = process_variable(node, ctxVarsCurLeftOnly[i], dmfactor);
                    if (isDivisable) {
                        break;
                    }
                }
            }

            if (!isDivisable) {
                for (let i = 0; i < ctxVarsCurRightOnly.length; i++) {
                    isDivisable = process_variable(node, ctxVarsCurRightOnly[i], dmfactor);
                    if (isDivisable) {
                        break;
                    }
                }
            }

        }

        ///////////////////////////////// LEFT and RIGHT  V A R I A B L E S//////////////////////////////////////////////////
        if (!isDivisable) {
            console.log("ctxVarsCurRightOnly:" + JSON.stringify(ctxVarsCurRightOnly));
            for (let i = 0; i < ctxVarsCurLeftOnly.length; i++) {
                for (let j = 0; j < ctxVarsCurRightOnly.length; j++) {
                    isDivisable = process_variables(node, ctxVarsCurLeftOnly[i], ctxVarsCurRightOnly[j], dmfactor);
                    if (isDivisable) {
                        break;
                    }
                }
                if (isDivisable) {
                    break;
                }
            }
        }
        return isDivisable;
    }


    function getNext(ctxVarsCur, curNum, minNum, maxNum) {
        if (!ctxVarsCur) return curNum;
        if (curNum < maxNum) {
            curNum = curNum + 1;
        }
        else if (curNum == maxNum) {
            curNum = minNum;
        }
        return curNum;
    }

    function getNextValue(ctxVarsCur, curNum) {
        if (!ctxVarsCur) return curNum;
        let newdivchkeqn, neweqn;
        /////////////////////////////START EQN LOGIC ///////////////////////////
        if (datarules[ctxVarsCur] && datarules[ctxVarsCur].eqn) {
            if (datarules[ctxVarsCur].eqn.indexOf("/") > 0) {
                newdivchkeqn = datarules[ctxVarsCur].eqn.replace(/(\/)/g, function replacer(match, $1) {
                    //return "%" + "";
                    return "*" + "";
                });
                neweqn = newdivchkeqn.replace(/(n)/g, function replacer(match, $1) {
                    return curNum + "";
                });
                curNum = eval(neweqn);
                /*
                while (eval(neweqn) !== 0) {
                    curNum = curNum + 1;
                    neweqn = newdivchkeqn.replace(/(n)/g, function replacer(match, $1) {
                        return curNum + "";
                    });
                }
                */
            }
            else {  //other than division
                neweqn = datarules[ctxVarsCur].eqn.replace(/(n)/g, function replacer(match, $1) {
                    return curNum + "";
                });
                curNum = eval(neweqn);
            }
        }
        return curNum;
    }


    function process_variable(node, ctxVarsCommon, dmfactor) {
        let min, max, startNum;
        let commonNum, commonVal;
        let left, right;
        if (datarules[ctxVarsCommon] && datarules[ctxVarsCommon].rng) {
            min = parseFloat(datarules[ctxVarsCommon].rng[0]) * dmfactor;
            max = parseFloat(datarules[ctxVarsCommon].rng[1]) * dmfactor;
        }
        else {
            min = 1;
            max = 99;
        }
        commonNum = parseFloat(util.getRandom(min, max));
        commonVal = getNextValue(ctxVarsCommon, commonNum);

        context.Variables[ctxVarsCommon] = commonVal / dmfactor;

        left = exec(node.left) * dmfactor;
        right = exec(node.right) * dmfactor;


        if (left % right == 0) {
            if (left > 0 && right > 0 && left != right && right != 1) {
                return true;
            }
        }
        startNum = commonNum;
        commonNum = getNext(ctxVarsCommon, commonNum, min, max);
        while (startNum != commonNum) {
            commonVal = getNextValue(ctxVarsCommon, commonNum);
            context.Variables[ctxVarsCommon] = commonVal / dmfactor;
            left = exec(node.left) * dmfactor;
            right = exec(node.right) * dmfactor;
            if (left % right == 0) {
                if (left > 0 && right > 0 && left != right && right != 1) {
                    return true;
                }
            }
            commonNum = getNext(ctxVarsCommon, commonNum, min, max);
        }

        return false;
    }


    function process_variables(node, ctxVarsleft, ctxVarsright) {
        let minl, maxl;
        let minr, maxr;
        let leftNum, rightNum;
        let left, right;
        let leftVal, rightVal;
        if (datarules[ctxVarsleft] && datarules[ctxVarsleft].rng) {
            minl = parseFloat(datarules[ctxVarsleft].rng[0]);
            maxl = parseFloat(datarules[ctxVarsleft].rng[1]);
        }
        else {
            minl = 1;
            maxl = 99;
        }

        if (datarules[ctxVarsright] && datarules[ctxVarsright].rng) {
            minr = parseFloat(datarules[ctxVarsright].rng[0]);
            maxr = parseFloat(datarules[ctxVarsright].rng[1]);
        }
        else {
            minr = 1;
            maxr = 99;
        }


        leftNum = parseFloat(util.getRandom(minl, maxl));
        left = getNextValue(ctxVarsleft, leftNum);

        rightNum = parseFloat(util.getRandom(minl, maxl));
        right = getNextValue(ctxVarsright, rightNum);

        context.Variables[ctxVarsleft] = left;
        context.Variables[ctxVarsright] = right;

        if (node.left.Identifier) left = exec(node.left);
        if (node.right.Identifier) right = exec(node.right);

        if (leftVal % rightVal == 0) {
            if (leftVal > 0 && rightVal > 0 && leftVal != rightVal && rightVal != 1) {
                return true;
            }
        }

        let startNuml = leftNum;
        let startNumr = rightNum;
        leftNum = getNext(ctxVarsleft, leftNum, minl, maxl);
        while (leftNum != startNuml) {
            left = getNextValue(ctxVarsleft, leftNum);
            context.Variables[ctxVarsleft] = left;
            if (node.left.Identifier) left = exec(node.left);
            if (node.right.Identifier) right = exec(node.right);
            if (leftVal % rightVal == 0) {
                if (leftVal > 0 && rightVal > 0 && leftVal != rightVal && rightVal != 1) {
                    return true;
                }
            }
            rightNum = startNumr;
            rightNum = getNext(ctxVarsright, rightNum, minr, maxr);
            while (rightNum != startNumr) {
                right = getNextValue(ctxVarsright, rightNum);
                context.Variables[ctxVarsright] = right;
                if (node.left.Identifier) left = exec(node.left);
                if (node.right.Identifier) right = exec(node.right);
                if (leftVal % rightVal == 0) {
                    if (leftVal > 0 && rightVal > 0 && leftVal != rightVal && rightVal != 1) {
                        return true;
                    }
                }
                rightNum = getNext(ctxVarsright, rightNum, minr, maxr);
            }

            leftNum = getNext(ctxVarsleft, leftNum, minl, maxl);
        }

        /*
       rightNum = getNext(ctxVarsright, rightNum, minr, maxr);       
       while (rightNum != startNumr) {
           right = getNextValue(ctxVarsright,rightNum);
           context.Variables[ctxVarsright] = right;
            leftVal = exec(node.left);
            rightVal = exec(node.right);
             if (leftVal % rightVal == 0) {
               if (leftVal > 0 && rightVal > 0 && leftVal != rightVal && rightVal !=1) {
                   return true;
               }
            } 
           //////////////////////////////////////////////////
           leftNum = startNuml;
           leftNum = getNext(ctxVarsleft, leftNum, minl, maxl);
           while (leftNum != startNuml) {
                left = getNextValue(ctxVarsleft,leftNum);
                  context.Variables[ctxVarsleft] = left;
    
            leftVal = exec(node.left);
            rightVal = exec(node.right);
    
             if (leftVal % rightVal == 0) {
               if (leftVal > 0 && rightVal > 0 && leftVal != rightVal && rightVal !=1) {
                   return true;
               }
            } 
    
               leftNum = getNext(ctxVarsleft, leftNum, minl, maxl);
           }
    
           rightNum = getNext(ctxVarsright, rightNum, minr, maxr);
       }
       */
        return false;
    }

    function process_f(fracidentifier) {
        let ciden;
        if (fracidentifier.indexOf("c_") >= 0) { //first digit is constant
            ciden = fracidentifier.split("c_")[1];
        }
        else {
            ciden = fracidentifier;
        }

        let val1 = ciden.split("_f_")[0];
        let val2 = ciden.split("_f_")[1];
        let fres = "";

        if (isNaN(val1)) {
            if (!context.Variables.hasOwnProperty(val1)) {
                context.Variables[val1] = util.getRandomByRules(datarules[val1]);
            }
            fres = "" + context.Variables[val1];
        }
        else {
            fres = "" + val1;
        }

        fres = fres + "f";

        if (isNaN(val2)) {
            if (!context.Variables.hasOwnProperty(val2)) {
                context.Variables[val2] = util.getRandomByRules(datarules[val2]);
            }
            fres = fres + context.Variables[val2];
        }
        else {
            fres = fres + val2;
        }
        context.Variables[fracidentifier] = fres;
        return fres;
    }

    function evaluate(expr, dr, uc) {
        // context.Variables = {};
        // stepTokens = [];
        // stepResults = {};
        setDataRules(dr);

        setUseCase(uc);

        console.log("******************** Evaluate Conditions ********************");
        console.log("expr.." + JSON.stringify(expr));
        console.log("******************** Evaluate Conditions ********************");

        condexps = parser.parseStep(expr, "cond");
        for (let i = 0; i < condexps.StepExpressions.length; i++) {
            //console.log("StepExpressions:step-" + stepidx + ":Exp-" + i + ":" + JSON.stringify(tree.StepExpressions[i]));
            let result;
            let reRun = true;
            while (reRun) {
                try {
                    result = exec(condexps.StepExpressions[i]);
                    reRun = false;
                }
                catch (e) {
                    //this happens only based on check of all the possibilites
                    //no chance here to infinite loop set else condition reRun false
                    if (e.message == "ContextChanged") {
                        reRun = true;
                        //reexecuted the expression
                        console.log("Reexecuting the StepExpressions...step" + stepidx);
                        //  result = exec(tree.StepExpressions[i]);
                        // }
                    }
                    else {
                        reRun = false;
                    }
                }
            }
        }


        console.log("******************** Evaluate Steps ********************");
        console.log("expr.." + JSON.stringify(expr));
        console.log("******************** Evaluate Steps ********************");

        let stepidx = 1;
        // let resultobj = {};
        // let tokenobj = {};
        // let resultToken = [];
        let resultArr;

        tree = parser.parseStep(expr, "step" + stepidx);
        while (tree.StepExpressions && tree.StepExpressions.length > 0) {
            resultArr = new Array;
            for (let i = 0; i < tree.StepExpressions.length; i++) {
                //console.log("StepExpressions:step-" + stepidx + ":Exp-" + i + ":" + JSON.stringify(tree.StepExpressions[i]));
                let result
                let reRun = true;
                while (reRun) {
                    try {
                        result = exec(tree.StepExpressions[i]);
                        reRun = false;
                    }
                    catch (e) {
                        //this happens only based on check of all the possibilites
                        //no chance here to infinite loop set else condition reRun false
                        if (e.message == "ContextChanged") {
                            reRun = true;
                            //reexecuted the expression
                            console.log("Reexecuting the StepExpressions...step" + stepidx);
                            //  result = exec(tree.StepExpressions[i]);
                            // }
                        }
                        else {
                            reRun = false;
                        }
                    }
                }
                context.Variables["step" + stepidx] = result;
                console.log("context.Variables:" + JSON.stringify(context.Variables));
                resultArr.push(result);
            }
            let robj = { "Result": resultArr };
            resultobj["step" + stepidx] = robj;
            //  resultToken.push(robj);
            //   console.log("result:" + result);
            //   console.log("context.Variables:step-" + i + 1 + ":" + JSON.stringify(context.Variables));
            // }
            let tObj = { "Token": tree.StepTokens };
            tokenobj["step" + stepidx] = tObj;
            //console.log("tokenobj:step-" + stepidx + ":" + JSON.stringify(tokenobj));

            //resultobj["step" + stepidx] = resultToken;
            // stepTokens.push(tokenobj);
            //stepResults.push(resultobj);
            stepidx = stepidx + 1;
            tree = parser.parseStep(expr, "step" + stepidx);
        }

        console.log("******************** Evaluate Main ********************");
        var tokens = parser.getTokens(expr);
        //console.log("Main Token:" + JSON.stringify(tokens));
        //wrapper
        let resTokenObj = { "Token": tokens };
        // let resTokenArr = [];
        // resTokenArr.push(resTokenObj);
        tokenobj["main"] = resTokenObj;
        //stepTokens.push({"main":resTokenObj});

        var tree = parser.parse(expr);
        let resultMain;
        reRun = true;
        cnt = 10; //safe side to exit. Infine loop  is happening with same expression continuing multiple times...
        while (reRun && cnt > 0) {
            try {
                cnt--;
                //could be array resulted from the functions sotrlh,sorthl
                resultMain = exec(tree);
                reRun = false;
            }
            catch (e) {
                //this happens only based on check of all the possibilites
                //no chance here to infinite loop set else condition reRun false
                if (e.message == "ContextChanged") {
                    reRun = true;
                    console.log("Reexecuting the main with new context");
                    //  result = exec(tree.StepExpressions[i]);
                    // }
                }
                else {
                    reRun = false;
                }
            }
        }
        if (Object.prototype.toString.call(resultMain) === '[object Array]') {
            resultMain = resultMain.map(a => { return "" + a })
        }
        else {
            resultMain = util.trm(resultMain.toString(), "__");
        }
        resultobj["main"] = { "Result": resultMain };
        //console.log("Main tree.." + JSON.stringify(tree));
        // stepResults["Results"] = resultobj;
        //console.log("stepTokens.." + JSON.stringify(tokenobj));
        //console.log("stepResults.." + JSON.stringify(resultobj));
    }

    function data() {
        return context.Variables;
    }

    function setDataRules(dr) {
        datarules = dr;
    }

    function setUseCase(uc) {
        usecase = uc;
    }

    function tokens() {
        return tokenobj;
    }

    function results() {
        return resultobj;
    }

    return {
        evaluate: evaluate, //results of main and steps
        results: results,
        data: data,  //all variables and values
        tokens: tokens //all tokens of main and steps
    };
};
/////////Parser /////////////
TapDigit.Parser = function () {

    let lexer = new TapDigit.Lexer(),
        T = TapDigit.Token;

    let lexerstep = new TapDigit.Lexer();
    function matchOp(token, op) {
        return (typeof token !== 'undefined') &&
            token.type === T.Operator &&
            token.value === op;
    }

    // ArgumentList := Expression |
    //                 Expression ',' ArgumentList
    function parseArgumentList() {
        let token, expr, args = [];

        while (true) {
            expr = parseExpression();
            if (typeof expr === 'undefined') {
                // TODO maybe throw exception?
                break;
            }
            args.push(expr);
            token = lexer.peek();
            if (!matchOp(token, ',')) {
                break;
            }
            lexer.next();
        }

        return args;
    }

    function parseArgument() {
        let token, expr, args = [];

        while (true) {
            expr = parseExpression();
            if (typeof expr === 'undefined') {
                // TODO maybe throw exception?
                break;
            }
            args.push(expr);
            token = lexer.peek();
            if (!matchOp(token, ',')) {
                break;
            }
            lexer.next();
        }

        return args[0];
    }

    // FunctionCall ::= Identifier '(' ')' ||
    //                  Identifier '(' ArgumentList ')'
    function parseFunctionCall(name) {
        let token, args = [], arg = {};

        token = lexer.next();
        if (!matchOp(token, '(')) {
            throw new SyntaxError('Expecting ( in a function call "' + name + '"');
        }

        token = lexer.peek();
        if (!matchOp(token, ')')) {
            if (name.indexOf("step") >= 0) {
                arg = parseArgument();
            }
            else {
                args = parseArgumentList();
            }
        }

        token = lexer.next();
        if (!matchOp(token, ')')) {
            throw new SyntaxError('Expecting ) in a function call "' + name + '"');
        }
        if (name.indexOf("step") >= 0) {
            return arg;
        }
        else {
            return {
                'FunctionCall': {
                    'name': name,
                    'args': args
                }
            }
        }
    }

    // Primary ::= Identifier |
    //             Number |
    //             '(' Assignment ')' |
    //             FunctionCall
    function parsePrimary() {
        let token, expr;

        token = lexer.peek();

        if (typeof token === 'undefined') {
            throw new SyntaxError('Unexpected termination of expression');
        }

        if (token.type === T.Identifier) {
            token = lexer.next();
            if (matchOp(lexer.peek(), '(')) {
                return parseFunctionCall(token.value);
            } else {
                return {
                    'Identifier': token.value
                };
            }
        }

        if (token.type === T.Number) {
            token = lexer.next();
            return {
                'Number': token.value
            };
        }

        if (token.type === T.String) {
            token = lexer.next();
            return {
                'String': token.value
            };
        }

        if (matchOp(token, '(')) {
            lexer.next();
            expr = parseAssignment();
            token = lexer.next();
            if (!matchOp(token, ')')) {
                throw new SyntaxError('Expecting )');
            }
            return {
                'Expression': expr
            };
        }

        throw new SyntaxError('Parse error, can not process token ' + token.value);
    }

    // Unary ::= Primary |
    //           '-' Unary
    function parseUnary() {
        let token, expr;

        token = lexer.peek();
        if (matchOp(token, '-') || matchOp(token, '+')) {
            token = lexer.next();
            expr = parseUnary();
            return {
                'Unary': {
                    operator: token.value,
                    expression: expr
                }
            };
        }

        return parsePrimary();
    }

    // Multiplicative ::= Unary |
    //                    Multiplicative '*' Unary |
    //                    Multiplicative '/' Unary
    function parseMultiplicative() {
        let token, expr;
        expr = parseUnary();
        token = lexer.peek();
        while (matchOp(token, '*') || matchOp(token, '/')) {
            token = lexer.next();
            expr = {
                'Binary': {
                    operator: token.value,
                    left: expr,
                    right: parseUnary()
                }
            };
            token = lexer.peek();
        }
        return expr;
    }


    // Multiplicative ::= Unary |
    //                    Multiplicative '*' Unary |
    //                    Multiplicative '/' Unary
    function parseRelation() {
        let token, expr;
        expr = parseAdditive();
        token = lexer.peek();
        while (matchOp(token, '<') || matchOp(token, '>')) {
            token = lexer.next();
            expr = {
                'Binary': {
                    operator: token.value,
                    left: expr,
                    right: parseAdditive()
                }
            };
            token = lexer.peek();
        }
        return expr;
    }

    // Multiplicative ::= Unary |
    //                    Multiplicative '*' Unary |
    //                    Multiplicative '/' Unary
    function parseConcat() {
        let token, expr;
        expr = parseRelation();
        token = lexer.peek();
        while (matchOp(token, ':')) {
            token = lexer.next();
            expr = {
                'Binary': {
                    operator: token.value,
                    left: expr,
                    right: parseRelation()
                }
            };
            token = lexer.peek();
        }
        return expr;
    }

    // Additive ::= Multiplicative |
    //              Additive '+' Multiplicative |
    //              Additive '-' Multiplicative
    function parseAdditive() {
        let token, expr;
        expr = parseMultiplicative();
        token = lexer.peek();
        while (matchOp(token, '+') || matchOp(token, '-')) {
            token = lexer.next();
            expr = {
                'Binary': {
                    operator: token.value,
                    left: expr,
                    right: parseMultiplicative()
                }
            };
            token = lexer.peek();
        }
        return expr;
    }

    // Assignment ::= Identifier '=' Assignment |
    //                Additive
    function parseAssignment() {
        let token, expr;

        expr = parseConcat();

        if (typeof expr !== 'undefined' && expr.Identifier) {
            token = lexer.peek();
            if (matchOp(token, '=')) {
                lexer.next();
                return {
                    'Assignment': {
                        name: expr,
                        value: parseAssignment()
                    }
                };
            }
            return expr;
        }

        return expr;
    }

    // Expression ::= Assignment
    function parseExpression() {
        return parseAssignment();
    }

    function parse(expression) {
        var expr, token;

        lexer.reset(expression);
        expr = parseExpression();

        token = lexer.next();
        if (typeof token !== 'undefined') {
            throw new SyntaxError('Unexpected token ' + token.value);
        }

        return {
            'Expression': expr
        };
    }

    //not using this one
    function getAllTokens(expr) {
        let token;
        let tokens = [];
        lexerstep.reset(expr);
        while (true) {
            token = lexerstep.next();
            if (typeof token === 'undefined') {
                break;
            }
            tokens.push(token);
        }
        return tokens;
    }

    function getTokens(expr) {
        let token;
        let tokens = [];
        lexerstep.reset(expr);
        while (true) {
            token = lexerstep.next();
            if (typeof token === 'undefined') {
                break;
            }
            if (token.type === T.Identifier && token.value.indexOf("step") >= 0) {

            }
            else {
                tokens.push(token);
            }
        }
        return tokens;
    }

    function getStepTokens(expr, stepname) {
        let token;
        let bHitStep = false;
        let steptokens = [];
        let tokensObj = {};
        let tokens = [];
        lexerstep.reset(expr);
        token = lexerstep.peek();
        while (typeof token !== 'undefined') {
            // console.log("eqn token:" + JSON.stringify(token));
            token = lexerstep.next();
            if (stepname == token.value && matchOp(lexerstep.peek(), '(')) {
                bHitStep = true;
            }
            if (bHitStep) {
                tokens.push(token);
            }
            if (bHitStep && matchOp(lexerstep.peek(), ')')) {
                token = lexerstep.next();
                tokens.push(token);
                steptokens.push(tokens);
                tokens = [];
                bHitStep = false;
            }
            token = lexerstep.peek();
        }
        // console.log("eqn tkns:" + JSON.stringify(steptokens));
        return steptokens;
    }

    function parseStep(expression, stepname) {
        var expr, token, steptokens;
        // expr = "";
        expr = new Array;
        lexer.reset(expression);

        token = lexer.peek();
        while (typeof token !== 'undefined') {
            //console.log("token:" + JSON.stringify(token));
            if (token.type === T.Identifier) {
                token = lexer.next();
                if (matchOp(lexer.peek(), '(')) {
                    if (stepname == token.value) {
                        let result = parseFunctionCall(token.value);
                        let wrapResult = { 'Expression': result };
                        expr.push(wrapResult);
                        // console.log("expr-" + JSON.stringify(expr));
                    }
                }
            }
            token = lexer.next();
            token = lexer.peek();
        }

        steptokens = getStepTokens(expression, stepname);
        return {
            'StepExpressions': expr,
            'StepTokens': steptokens
        };
    }
    return {
        parse: parse,
        getTokens: getTokens,
        parseStep: parseStep
    };
};
///////////
TapDigit.Fractions = function (ctx) {

    function initFract() {
        let opd = {};
        opd.oprdN = 0;
        opd.oprdD = 1;
        return opd;
    }

    function getFrac(opd) {
        let opdr = {};

        if (opd.indexOf("m") >= 0) {
            let opdmixed = opd.split("m");
            let opdm = opdmixed[0];
            let opdf = opdmixed[1];

            if (opdf.indexOf("f") >= 0) {
                let opdparts = opdf.split("f");
                if (opdparts[0] == "" || opdparts[1] == "") {
                    opdr.oprdN = 0;
                    opdr.oprdD = 1;
                }
                else {
                    opdr.oprdN = parseFloat(opdparts[0]);
                    opdr.oprdD = parseFloat(opdparts[1]);
                }
            }
            else { //plain number
                opdr.oprdN = parseFloat(opd);
                opdr.oprdD = 1;
            }
            //conver to Fractions
            opdr.oprdN = opdr.oprdN + opdr.oprdD * parseFloat(opdm);
        }
        else if (opd.indexOf("f") >= 0) {
            let opdparts = opd.split("f");
            opdr = {};
            if (opdparts[0] == "" || opdparts[1] == "") {
                opdr.oprdN = 0;
                opdr.oprdD = 1;
            }
            else {
                opdr.oprdN = parseFloat(opdparts[0]);
                opdr.oprdD = parseFloat(opdparts[1]);
            }
        }
        else { //plain number
            opdr = {};
            opdr.oprdN = parseFloat(opd);
            opdr.oprdD = 1;
        }

        // console.log("opdr:" + JSON.stringify(opdr));
        return opdr;
    }


    function simplifyFrac(opd) {
        if (opd.oprdN == 0) return "0f1";
        let isneg = 1;
        if (opd.oprdN < 0 && opd.oprdD < 0) {
            opd.oprdN = -1 * opd.oprdN;
            opd.oprdD = -1 * opd.oprdD;
        }
        else {
            if (opd.oprdN < 0) {
                isneg = -1;
                opd.oprdN = isneg * opd.oprdN;
            }
            if (opd.oprdD < 0) {
                isneg = -1;
                opd.oprdD = isneg * opd.oprdD;
            }
        }
        let args = [];
        args.push(opd.oprdN);
        args.push(opd.oprdD);
        let gcd = ctx.Functions["gcd"].apply(null, args)
        // console.log("gcd:" + gcd);
        return parseFloat(opd.oprdN / gcd) * isneg + "f" + parseFloat(opd.oprdD / gcd);
    }

    function simplifyFracParts(opd) {
        if (opd.oprdN == 0) return "0f1";
        let isneg = 1;
        if (opd.oprdN < 0 && opd.oprdD < 0) {
            opd.oprdN = -1 * opd.oprdN;
            opd.oprdD = -1 * opd.oprdD;
        }
        else {
            if (opd.oprdN < 0) {
                isneg = -1;
                opd.oprdN = isneg * opd.oprdN;
            }
            if (opd.oprdD < 0) {
                isneg = -1;
                opd.oprdD = isneg * opd.oprdD;
            }
        }
        let result = {};
        let args = [];
        args.push(opd.oprdN);
        args.push(opd.oprdD);
        let gcd = ctx.Functions["gcd"].apply(null, args)
        // console.log("gcd:" + gcd);
        result.oprdN = isneg * parseFloat(opd.oprdN / gcd);
        result.oprdD = parseFloat(opd.oprdD / gcd);
        return result;
    }


    function performFracOp(opt, opd, opn) {
        switch (opn) {
            case '+':
                opt = getFrac(opt);
                opd = getFrac(opd);
                opt.oprdN = opt.oprdN * opd.oprdD + opt.oprdD * opd.oprdN;
                opt.oprdD = opt.oprdD * opd.oprdD;
                return simplifyFrac(opt);
            case '-':
                opt = getFrac(opt);
                opd = getFrac(opd);
                opt.oprdN = opt.oprdN * opd.oprdD - opt.oprdD * opd.oprdN;
                opt.oprdD = opt.oprdD * opd.oprdD;
                return simplifyFrac(opt);
            case '*':
                opt = getFrac(opt);
                opd = getFrac(opd);
                ////
                let dmoptN = util.countDecimals(opt.oprdN);
                let dmoptD = util.countDecimals(opt.oprdD);
                let dmfactopt = 0;

                if (dmoptN > 0 || dmoptD > 0) {
                    if (dmoptN > dmoptD) {
                        dmfactopt = Math.pow(10, dmoptN);
                    }
                    else {
                        dmfactopt = Math.pow(10, dmoptD);
                    }
                }

                if (dmfactopt != 0) {
                    opt.oprdN = opt.oprdN * dmfactopt;
                    opt.oprdD = opt.oprdD * dmfactopt;
                }


                let dmopdN = util.countDecimals(opd.oprdN);
                let dmopdD = util.countDecimals(opd.oprdD);
                let dmfactopd = 0;

                if (dmopdN > 0 || dmopdD > 0) {
                    if (dmopdN > dmopdD) {
                        dmfactopd = Math.pow(10, dmopdN);
                    }
                    else {
                        dmfactopd = Math.pow(10, dmopdD);
                    }
                }

                if (dmfactopd != 0) {
                    opd.oprdN = opd.oprdN * dmfactopd;
                    opd.oprdD = opd.oprdD * dmfactopd;
                }
                ///
                opt = simplifyFracParts(opt);
                opd = simplifyFracParts(opd);

                opt.oprdN = opt.oprdN * opd.oprdN;
                opt.oprdD = opt.oprdD * opd.oprdD;

                return simplifyFrac(opt);
            case '/':
                opt = getFrac(opt);
                opd = getFrac(opd);
                opt.oprdN = opt.oprdN * opd.oprdD;
                opt.oprdD = opt.oprdD * opd.oprdN;
                return simplifyFrac(opt);
        }
    }

    return {
        performFracOp: performFracOp
    }

};



///////////
TapDigit.Lexer = function () {
    let expression = '',
        length = 0,
        index = 0,
        marker = 0,
        T = TapDigit.Token;

    function peekNextChar() {
        let idx = index;
        return ((idx < length) ? expression.charAt(idx) : '\x00');
    }

    function getNextChar() {
        let ch = '\x00',
            idx = index;
        if (idx < length) {
            ch = expression.charAt(idx);
            index += 1;
        }
        return ch;
    }

    function isWhiteSpace(ch) {
        return (ch === '\u0009') || (ch === ' ') || (ch === '\u00A0');
    }

    function isLetter(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
    }

    function isDecimalDigit(ch) {
        return (ch >= '0') && (ch <= '9');
    }

    function isFractionDigit(ch) {
        return (ch === 'f');
    }

    function createToken(type, value) {
        return {
            type: type,
            value: value,
            start: marker,
            end: index - 1
        };
    }

    function skipSpaces() {
        let ch;

        while (index < length) {
            ch = peekNextChar();
            if (!isWhiteSpace(ch)) {
                break;
            }
            getNextChar();
        }
    }

    function scanOperator() {
        let ch = peekNextChar();
        if ('>+-*/()^%=;,:'.indexOf(ch) >= 0) {
            return createToken(T.Operator, getNextChar());
        }
        return undefined;
    }

    function isIdentifierStart(ch) {
        return (ch === '_') || isLetter(ch);
    }

    function isIdentifierPart(ch) {
        return isIdentifierStart(ch) || isDecimalDigit(ch);
    }

    function scanIdentifier() {
        let ch, id;

        ch = peekNextChar();
        if (!isIdentifierStart(ch)) {
            return undefined;
        }

        id = getNextChar();
        while (true) {
            ch = peekNextChar();
            if (!isIdentifierPart(ch)) {
                break;
            }
            id += getNextChar();
        }

        return createToken(T.Identifier, id);
    }

    function isStringStartOrEnd(ch) {
        return (ch === '\'');
    }

    function isOperator(ch) {
        return ('>+-*/()^%=;,'.indexOf(ch) >= 0)
    }

    function isStringPart(ch) {
        return isIdentifierStart(ch) || isDecimalDigit(ch) || isOperator(ch) || isWhiteSpace(ch);
    }

    function scanString() {
        var ch, id;

        ch = peekNextChar();
        if (!isStringStartOrEnd(ch)) {
            return undefined;
        }

        id = getNextChar();
        while (true) {
            ch = peekNextChar();

            if (isStringStartOrEnd(ch)) {
                id += getNextChar();
                break;
            }

            if (!isStringPart(ch)) {
                break;
            }
            id += getNextChar();
        }

        return createToken(T.String, id);
    }

    function scanNumber() {
        var ch, number;

        ch = peekNextChar();
        if (!isDecimalDigit(ch) && (ch !== '.')) {
            return undefined;
        }

        number = '';
        if (ch !== '.') {
            number = getNextChar();
            while (true) {
                ch = peekNextChar();
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += getNextChar();
            }
        }

        if (ch === '.') {
            number += getNextChar();
            while (true) {
                ch = peekNextChar();
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += getNextChar();
            }
        }

        if (ch === 'e' || ch === 'E') {
            number += getNextChar();
            ch = peekNextChar();
            if (ch === '+' || ch === '-' || isDecimalDigit(ch)) {
                number += getNextChar();
                while (true) {
                    ch = peekNextChar();
                    if (!isDecimalDigit(ch)) {
                        break;
                    }
                    number += getNextChar();
                }
            } else {
                ch = 'character ' + ch;
                if (index >= length) {
                    ch = '<end>';
                }
                throw new SyntaxError('Unexpected ' + ch + ' after the exponent sign');
            }
        }

        if (ch === 'f' || ch === 'F') {
            number += getNextChar();
            ch = peekNextChar();
            if (ch === '+' || ch === '-' || isDecimalDigit(ch) || ch == '.') {
                number += getNextChar();
                while (true) {
                    ch = peekNextChar();
                    if (!(isDecimalDigit(ch) || ch == '.')) {
                        break;
                    }
                    number += getNextChar();
                }
            } else {
                ch = 'character ' + ch;
                if (index >= length) {
                    ch = '<end>';
                }
                throw new SyntaxError('Unexpected ' + ch + ' after the exponent sign');
            }
        }

        if (ch === 'm' || ch === 'M') {
            number += getNextChar();
            ch = peekNextChar();
            if (ch === '+' || ch === '-' || isDecimalDigit(ch) || ch == '.') {
                number += getNextChar();
                while (true) {
                    ch = peekNextChar();
                    if (!(isDecimalDigit(ch) || ch == '.' || isFractionDigit(ch))) {
                        break;
                    }
                    number += getNextChar();
                }
                if (!(number.indexOf("f") > 0)) {
                    throw new SyntaxError('Mixed fraction has no fraction digit');
                }
            } else {
                ch = 'character ' + ch;
                if (index >= length) {
                    ch = '<end>';
                }
                throw new SyntaxError('Unexpected ' + ch + ' after the exponent sign');
            }
        }

        if (number === '.') {
            throw new SyntaxError('Expecting decimal digits after the dot sign');
        }

        return createToken(T.Number, number);
    }

    function reset(str) {
        expression = str;
        length = str.length;
        index = 0;
    }

    function next() {
        let token;

        skipSpaces();
        if (index >= length) {
            return undefined;
        }

        marker = index;

        token = scanString();
        if (typeof token !== 'undefined') {
            return token;
        }

        token = scanNumber();
        if (typeof token !== 'undefined') {
            return token;
        }

        token = scanOperator();
        if (typeof token !== 'undefined') {
            return token;
        }

        token = scanIdentifier();
        if (typeof token !== 'undefined') {
            return token;
        }


        throw new SyntaxError('Unknown token from character ' + peekNextChar());
    }

    function peek() {
        let token, idx;

        idx = index;
        try {
            token = next();
            if (token) {
                delete token.start;
                delete token.end;
            }
        } catch (e) {
            token = undefined;
        }
        index = idx;

        return token;
    }

    return {
        reset: reset,
        next: next,
        peek: peek
    };
};

/////////////Context ///////////
TapDigit.Context = function () {
    let Constants, Functions;

    Constants = {
        pi: 3.1415926535897932384,
        phi: 1.6180339887498948482
    };

    Functions = {
        abs: Math.abs,
        acos: Math.acos,
        asin: Math.asin,
        atan: Math.atan,
        ceil: Math.ceil,
        cos: Math.cos,
        exp: Math.exp,
        floor: Math.floor,
        //   ln: Math.ln,
        random: Math.random,
        sin: Math.sin,
        sqrt: Math.sqrt,
        tan: Math.tan,
        pow: Math.pow,
        step1: step1,
        step2: step2,
        step3: step3,
        step4: step4,
        step5: step5,
        step6: step6,
        step7: step7,
        step8: step8,
        cond: cond,
        shs1: shs,
        shs2: shs,
        shs3: shs,
        shs4: shs,
        shs5: shs,
        shs6: shs,
        sortlh: sortlh,
        sorthl: sorthl,
        gcd: gcd,
        isprime: isprime,
        issorthl: issorthl,
        issortlh: issortlh,
        high: high,
        low: low,
        lcm: lcm,
        time12: time12,
        whole: whole,
        round10: round10,
        floor10: floor10,
        ceil10: ceil10,
        round: Math.round,
        round100: round100,
        seq: seq,
        eqn: eqn,
        oper: oper,
        ineq: ineq,
        nconv: nconv,
        neq: neq
    };

    function whole() {
        return Number(String(arguments[0]).split(".")[0]);
    }

    function nconv() {
        let opts = arguments[1].toString().split('');
        let num = arguments[0];
        let rslt = "";
        let ntyp = "";
        if (arguments[2]) {
            ntyp = arguments[2];
        }
        if (num.toString().indexOf('%') >= 0) {
            num = num.split('%')[0] + 'f' + 100;
        }
        else if (num.toString().indexOf(".") >= 0) {
            num = num + 'f' + 1;
        }
        else if (num.toString().indexOf("m") >= 0) {
            let fracobj = new TapDigit.Fractions(new TapDigit.Context());
            num = fracobj.performFracOp(num.toString(), "1f1", "*");
        }
        else {
            num = num + 'f' + 1;
        }

        for (let i = 0; i < opts.length; i++) {
            switch (opts[i]) {
                case 'p':
                    {
                        let fracobj = new TapDigit.Fractions(new TapDigit.Context());
                        let num2 = fracobj.performFracOp(num.toString(), "1f100", "*");
                        let neweqn = num2.replace(/(f)/g, function replacer(match, $1) {
                            return "/";
                        });
                        rslt = rslt + eval(neweqn) + " ";

                        break;
                    }
                case 'd':
                    {
                        //convert to decimal
                        let neweqn = num.replace(/(f)/g, function replacer(match, $1) {
                            return "/";
                        });
                        rslt = rslt + eval(neweqn) + " ";
                        break;
                    }
                case 'f':
                    rslt = rslt + num.toString() + " " //no changes
                    break;
                case 'm':
                    let rnum = Number(num.split("f")[1]);
                    let lnum = Number(num.split("f")[0]);
                    if (rnum == lnum) {
                        rslt = rslt + "1" + " " //no changes
                    }
                    else if (lnum < rnum) {
                        rslt = rslt + num.toString() + " " //no changes
                    }
                    else {
                        let rem = whole(lnum / rnum);
                        let oprdN = lnum - rnum * rem;
                        rslt = rslt + rem + "m" + oprdN + "f" + rnum + " ";
                    }
                    break;
                default:
            }
        }
        return rslt.trim();
    }

    function uconv() {

    }


    function neq() {
        //convert everything to proper functions and compare
        let nums = arguments;
        let fracobj = new TapDigit.Fractions(new TapDigit.Context());
        for (let i = 0; i < nums.length; i++) {
            if (nums[i].toString().indexOf("%") >= 0) {
                nums[i] = nums[i].split('%')[0] + 'f' + 100;
            }
            else if (nums[i].toString().indexOf(".") >= 0) {
                nums[i] = fracobj.performFracOp(nums[i].toString(), "1f1", "*");
            }
            else if (nums[i].toString().indexOf("m") >= 0) {
                nums[i] = fracobj.performFracOp(nums[i].toString(), "1f1", "*");
            }
            else if (nums[i].toString().indexOf("f") >= 0) {

            }
            else {
                nums[i] = nums[i] + 'f' + 1;
            }
        }
        let iseq = true;
        let cmpnum = nums[0];
        for (let i = 1; i < nums.length; i++) {
            if (cmpnum != nums[i]) {
                iseq = false; break;
            }
            cmpnum = nums[i];
        }
        return (iseq == true) ? 'true' : 'false';
    }



    function oper(op) {
        if (op == undefined) {
            op = util.getRandomOperator();
        }
        else {
            if (op.length > 1) op = util.getRandomOperator(op);
        }
        return op;
    }

    function eqn(left, right, op) {
        if (right == undefined) {
            return left;
        }
        if (op == undefined) {
            op = util.getRandomOperator();
        }
        else {
            if (op.length > 1) op = util.getRandomOperator(op);
        }
        let fracobj = new TapDigit.Fractions(new TapDigit.Context());
        if (left.toString().indexOf("f") >= 0 || right.toString().indexOf("f") >= 0 ||
            left.toString().indexOf("m") >= 0 || right.toString().indexOf("m") >= 0) {
            return fracobj.performFracOp(left.toString(), right.toString(), op)
        }
        else {
            if (op == "+") {
                return Number(left) + Number(right);
            }
            else if (op == "*") {
                return Number(left) * Number(right);
            }
            else if (op == "-") {
                return Number(left) - Number(right);
            }
            else if (op == "/") {
                return Number(left) / Number(right);
            }
        }
    }

    function getfnum(left, right) {
        let rmult, lmult;
        rmult = 1; lmult = 1;
        let lnum, rnum;
        if (left.toString().indexOf("f") >= 0) {
            lmult = Number(left.split("f")[1]);
            lnum = Number(left.split("f")[0]);
        }
        else {
            lnum = Number(left);
        }
        if (right.toString().indexOf("f") >= 0) {
            rmult = Number(right.split("f")[1]);
            rnum = Number(right.split("f")[0]);
        }
        else {
            rnum = Number(right);
        }
        lnum = lnum * rmult;
        rnum = rnum * lmult;
        return [lnum, rnum];
    }

    function ineq(left, right) {
        let nums;
        if (left.toString().indexOf("f") >= 0 || right.toString().indexOf("f") >= 0) {
            nums = getfnum(left, right);
            left = nums[0];
            right = nums[1];
        }
        if (left > right) return ">"
        else if (left < right) return "<"
        else return "="
    }


    function seq(pos, pose, eqn, sep) {
        let step = 1;
        pos = Number(pos); pose = Number(pose);
        if (Number(pose) < Number(pos)) {
            step = -1;
        }
        if (sep == undefined) sep = "__";
        let evalnum = pos;
        let rslt = "";
        while (evalnum != pose + step) {
            let neweqn = eqn.replace(/(n)/g, function replacer(match, $1) {
                return evalnum + "";
            });
            rslt = rslt + eval(neweqn) + sep;
            evalnum = evalnum + step;
        }
        let regStr = "^" + sep + "+|" + sep + "+$";
        let regExp = new RegExp(regStr, "g");
        return rslt.replace(regExp, '');
    }

    function round100(val) {
        let whnum = String(round10(Number(val), 0)).split(".")[0];
        if (Number(whnum) > 0) {
            return round10(round10(val, 0), whnum.length - 1);
        }
        else {
            if (String(val).split(".").length > 1) {
                let decnum = String(val).split(".")[1].replace(/0+$/, '');
                let roundlen = 1;
                for (let i = 0; i < decnum.length; i++) {
                    if (decnum[i] == "0") {
                        roundlen = roundlen + 1;
                    }
                    else {
                        break;
                    }
                }
                let mul = 1;
                for (let j = 0; j < decnum.length; j++) {
                    mul = mul * 10;
                }
                return round10(decnum / mul, -1 * roundlen);
            }
            else {
                return val;
            }
        }
    }

    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round

    function decimalAdjust(type, value, exp) {
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // If the value is negative...
        if (value < 0) {
            return -decimalAdjust(type, -value, exp);
        }
        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }


    function round10(value, exp) {
        return decimalAdjust('round', value, exp);
    };


    function floor10(value, exp) {
        return decimalAdjust('floor', value, exp);
    };

    // Decimal ceil

    function ceil10(value, exp) {
        return decimalAdjust('ceil', value, exp);
    };


    function time12() {
        let h = arguments[0];
        let m = arguments[1];
        let hh = arguments[2];
        let strap = arguments[3] ? arguments[3].toUpperCase() : "AM";

        let mh = Math.floor(m / 60);
        let mm = m - mh * 60;

        let t = mh + h;

        let result = "";
        if (t < 12) {
            result = pad(t, 2, '0') + ":" + pad(mm, 2, '0') + ' ' + strap;
        }
        else if (t == 12) {
            if (hh < 12) { result = pad(t, 2, '0') + ":" + pad(mm, 2, '0') + " " + (strap == "AM" ? "PM" : "AM") }                                              //am to pm  }
            if (hh == 12) { result = pad(t, 2, '0') + ":" + pad(mm, 2, '0') + ' ' + strap; }
        }
        else {
            t = t % 12;
            if (hh < 12) { result = pad(t, 2, '0') + ":" + pad(mm, 2, '0') + " " + (strap == "AM" ? "PM" : "AM") }                                              //am to pm  }
            if (hh == 12) { result = pad(t, 2, '0') + ":" + pad(mm, 2, '0') + ' ' + strap; }
            //  result = pad(t,2,'0') + ":" + pad(mm,2,'0') + " " + (strap=="AM"?"PM":"AM");
            //possible bug RARE case more than 24 than show AM to AM
        }
        return result;
    }

    function pad(n, width, z) { n = '' + n; while (n.length < width) n = z + n; return n; }


    function high() {
        let sortlist = [];
        for (let i = 0; i < arguments.length; i++) {
            sortlist.push(arguments[i]);
        }
        sortlist.sort(comparehlany);
        return sortlist[0];
    }

    function low() {
        let sortlist = [];
        for (let i = 0; i < arguments.length; i++) {
            sortlist.push(arguments[i]);
        }
        sortlist.sort(comparelhany);
        return sortlist[0];
    }

    function issortlh() {
        let sortlist = [];
        for (let i = 0; i < arguments.length; i++) {
            sortlist.push(arguments[i]);
        }
        sortlist.sort(comparelhany);
        for (let i = 0; i < arguments.length; i++) {
            if (!(arguments[i].toString() === sortlist[i].toString())) {
                return 'false'  //false
            }
        }
        return 'true'  //true
    }

    function sortlh() {
        let sortlist = [];
        for (let i = 0; i < arguments.length; i++) {
            sortlist.push(arguments[i]);
        }
        sortlist.sort(comparelhany);
        return sortlist;
    }

    function issorthl() {
        let sortlist = [];
        for (let i = 0; i < arguments.length; i++) {
            sortlist.push(arguments[i]);
        }
        sortlist.sort(comparehlany);

        for (let i = 0; i < arguments.length; i++) {
            if (!(arguments[i].toString() === sortlist[i].toString())) {
                return 'false'  //false
            }
        }
        return 'true'  //true
    }

    function sorthl() {
        let sortlist = [];
        for (let i = 0; i < arguments.length; i++) {
            sortlist.push(arguments[i]);
        }
        sortlist.sort(comparehlany);
        return sortlist;
    }

    function comparehlany(f1, f2) {
        if (isNaN(f1) || isNaN(f2)) {
            if (!isNaN(f1)) {
                //convert to f unumber]
                f1 = "" + f1 + "f1";
            }
            if (!isNaN(f2)) {
                //convert to f unumber
                f2 = "" + f2 + "f1";
            }
            if (f1.split("m")[0] !== f1) {
                //convert to fraction
                let p2 = f1.split("f")[1];
                let p1 = parseFloat(p2) * parseFloat(f1.split("m")[0]) + parseFloat(f1.split("f")[0]);
                f1 = p1 + "f" + p2;
            }
            if (f1.split("f")[1] === f2.split("f")[1]) {
                return parseFloat(f2.split("f")[0]) - parseFloat(f1.split("f")[0])
            }
            else {
                return parseFloat(f2.split("f")[0]) * parseFloat(f1.split("f")[1]) - parseFloat(f1.split("f")[0]) * parseFloat(f2.split("f")[1])
            }
        }
        else {
            return f2 - f1;
        }
    }

    function comparelhany(f1, f2) {
        if (isNaN(f1) || isNaN(f2)) {
            if (!isNaN(f1)) {
                //convert to f unumber]
                f1 = "" + f1 + "f1";
            }
            if (!isNaN(f2)) {
                //convert to f unumber
                f2 = "" + f2 + "f1";
            }
            if (f1.split("m")[0] !== f1) {
                //convert to fraction
                let p2 = f1.split("f")[1];
                let p1 = parseFloat(p2) * parseFloat(f1.split("m")[0]) + parseFloat(f1.split("f")[0]);
                f1 = p1 + "f" + p2;
            }
            if (f1.split("f")[1] === f2.split("f")[1]) {
                return parseFloat(f1.split("f")[0]) - parseFloat(f2.split("f")[0])
            }
            else {
                return parseFloat(f1.split("f")[0]) * parseFloat(f2.split("f")[1]) - parseFloat(f2.split("f")[0]) * parseFloat(f1.split("f")[1])
            }
        }
        else {
            return f1 - f2;
        }
    }

    function gcd() {
        let gcdlist = [];
        for (let i = 0; i < arguments.length; i++)
            gcdlist.push(arguments[i]);
        // var points = [40, 100, 1, 5, 25, 10];
        //sort by lowest to highest
        gcdlist.sort(function (a, b) { return a - b });
        let cnt = gcdlist.length;
        let i = 1;
        let numone = gcdlist[0];
        let numtwo;
        let result;
        while (i < cnt) {
            numtwo = gcdlist[i];
            while (1) {
                result = numtwo % numone;
                if (result == 0) break;
                numtwo = numone;
                numone = result;
            }
            i = i + 1;
        }
        return numone;
    }

    function lcm() {
        let multval = 1;
        for (let i = 0; i < arguments.length; i++) {
            multval = multval * arguments[i];
        }
        let absval = Math.abs(multval);
        //////////////////
        let gcdlist = [];
        for (let i = 0; i < arguments.length; i++)
            gcdlist.push(arguments[i]);
        // var points = [40, 100, 1, 5, 25, 10];
        //sort by lowest to highest
        gcdlist.sort(function (a, b) { return a - b });
        let cnt = gcdlist.length;
        let i = 1;
        let numone = gcdlist[0];
        let numtwo;
        let result;
        while (i < cnt) {
            numtwo = gcdlist[i];
            while (1) {
                result = numtwo % numone;
                if (result == 0) break;
                numtwo = numone;
                numone = result;
            }
            i = i + 1;
        }
        // return numone;
        ///////////////////////


        return absval / numone;
    }

    function isprime(value) {
        value = Number(value);
        for (var i = 2; i < value; i++) {
            if (value % i === 0) {
                //  return 0;   //false
                return 'false'  //false
            }
        }
        // return 1; //true
        return 'true' //true
    }

    function step1(myarg) {
        return myarg;
    }

    function step2(myarg) {
        return myarg;
    }

    function step3(myarg) {
        return myarg;
    }

    function shs(myarg) {
        return 0;
    }

    function step4(myarg) {
        return myarg;
    }

    function step5(myarg) {
        return myarg;
    }

    function step6(myarg) {
        return myarg;
    }

    function step7(myarg) {
        return myarg;
    }

    function step8(myarg) {
        return myarg;
    }

    function step9(myarg) {
        return myarg;
    }

    function cond(myarg) {
        return myarg;
    }

    return {
        Constants: Constants,
        Functions: Functions,
        Variables: {}
    };
};

TapUtil.Util = function () {
    let range = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var primes = {};

    let createRange = function (datarules) {
        //shuffle
    };

    let setPrimes = function (max) {
        if (primes.hasOwnProperty("2")) {
            return;
        }
        for (var i = 2; i < max; i++) {
            primes[i] = true;
        }
        var limit = Math.sqrt(max);
        for (var i = 2; i < limit; i++) {
            if (primes[i] === true) {
                for (var j = i * i; j < max; j += i) {
                    primes[j] = false;
                }
            }
        }
    }


    let pad = function (n, width, z) { n = '' + n; while (n.length < width) n = z + n; return n; }

    //trim
    let trm = function (val, sep) {
        let regStr = "^" + sep + "+|" + sep + "+$";
        let regExp = new RegExp(regStr, "g");
        return val.replace(regExp, '');
    }

    let rndvar = function (rslt, diff, min, max) {
        let rndval;
        if (rslt - diff >= min && rslt + diff <= max) {
            rndval = getRandom(rslt - diff, rslt + diff)
        }
        else if (rslt - diff < min) {
            let zo = getRandom(0, 1);
            rndval = zo == 0 ? getRandom(rslt - diff + 12, 12) : getRandom(min, rslt + diff);
        }
        else if (rslt + diff > max) {
            let zo = getRandom(0, 1);
            rndval = zo == 0 ? getRandom(rslt - diff, max) : getRandom(min, (rslt + diff) % max);
        }
        return rndval;
    }

    let getRandomChoices = function (result, datarule) {
        console.log("processing random choices for..." + JSON.stringify(result));
        if (Object.prototype.toString.call(result) === '[object Array]') {
            let arrresult = new Array();
            let sh = getShuffle([0, 1, 2, 3]);
            for (let k = 0; k < sh.length; k++) {
                if (sh[k] == 0) { arrresult.push(JSON.parse(JSON.stringify(result))); }
                else {
                    let mys = getShuffle(JSON.parse(JSON.stringify(result)));
                    arrresult.push(mys);
                }
            }
            return arrresult;
        }
        //multi answer question
        else if (isNaN(result) && (result.indexOf("__") > 0 || result.indexOf(" ") > 0 || result.indexOf(",") > 0)) {
            return [];
        }
        else if (result == 'true' || result == 'false') {
            return getShuffle(["true", "false"]);
        }
        else if (isNaN(result) && ("<>=".indexOf(result) >= 0)) {
            return getShuffle([">", "<", "="]);
        }
        else if (result.indexOf("m") > 0 || result.indexOf("f") > 0) {
            //get numbers
            if (result.indexOf("m") > 0) {
                //later
            }
            else if (result.indexOf("f") > 0) {
                let fres = [];
                fres.push(result);
                let n1 = parseFloat(result.split("f")[0]);
                let n2 = parseFloat(result.split("f")[1]);
                //generate n1 and n2
                let cnt = 1;
                while (cnt != 4) {
                    // let nn1 = getRandom(1, n1 + 5)
                    //let nn2 = getRandom(1, n2 + 10)
                    let nn1 = rndvar(n1, 3, 1, n1 + 5); //getRandom(1, 12)
                    let nn2 = rndvar(n2, 3, 1, n1 + 5);
                    let result2 = nn1 + "f" + nn2;
                    if (result != result2) {
                        cnt = cnt + 1;
                        fres.push(result2);
                    }
                }
                return getShuffle(fres);
            }
        }
        else if (isNaN(result) && result.indexOf(":") > 0) {
            let fres = [];
            fres.push(result);

            let r1, r2;
            if (result.indexOf("AM") > 0 || result.indexOf("PM") > 0) {
                r2 = result.split(" ")[1];
                r1 = result.split(" ")[0];
            }
            else {
                r1 = result;
                r2 = "";
            }
            let n1 = parseFloat(r1.split(":")[0]);
            let n2 = parseFloat(r1.split(":")[1]);

            //generate n1 and n2
            let cnt = 1;
            while (cnt != 4) {
                let nn1 = rndvar(n1, 3, 1, 12); //getRandom(1, 12)
                let nn2 = rndvar(n2, 5, 1, 59);
                let result2;
                if (r2 != "") {
                    let ampm = getShuffle(["AM", "PM"])[0];
                    result2 = pad(nn1, 2, '0') + ":" + pad(nn2, 2, '0') + " " + ampm;
                }
                else {
                    result2 = pad(nn1, 2, '0') + ":" + pad(nn2, 2, '0');
                }

                if (result != result2) {
                    cnt = cnt + 1;
                    fres.push(result2);
                }
            }
            return getShuffle(fres);
        }
        else {
            return getRandomChoiceNumber(result);
        }
    }

    let getRandomOperator = function (opr) {
        let charr;
        if (opr == undefined) {
            charr = "+-*/".split('');
        }
        else {
            charr = opr.split('');
        }
        return getShuffle(charr)[0];
    }

    let getRandomChoiceNumber = function (result) {
        console.log("processing random choice number for..." + JSON.stringify(result));
        let dcntresult = countDecimals(result);
        let dmfactor = 0;

        var rslt;
        if (dcntresult > 0) {
            dmfactor = Math.pow(10, dcntresult);
            rslt = Number(result) * dmfactor;
            if (rslt % dmfactor == 0) {
                rslt = Number(result);
                dmfactor = 1;
            }
        }
        else {
            rslt = Number(result);
        }

        let charr = [0, 0, 0, 0];
        let ch1, ch2, ch3;

        if (rslt <= 9) {
            ch1 = getRandom(0, 9);
            ch2 = getRandom(1, 9) * 10 + rslt;
            ch3 = getRandom(1, rslt * 9);
        }
        else if (rslt <= 99) {
            ch1 = getRandom(0, 99);
            ch2 = getRandom(1, 9) * 10 + rslt;
            ch3 = getRandom(1, 9) * 10;
            let ch3res = rslt - ch3;
            if (ch3res <= 0) {
                ch3 = ch3 - rslt;
            }
            else {
                ch3 = ch3res;
            }
        }
        else {
            let dsize = rslt.toString().length;
            let d1 = rslt.toString()[0];
            let minN = 1;
            while (dsize--) {
                minN = minN * 10;
            }
            // 1000 - 9999
            //2000 - 2999 //keep the first digit same
            ch1 = getRandom(minN / 10 * d1, minN / 10 * d1 + (minN - 1) / 10);
            let ch2ran = getRandom(1, 9) * 10;
            let ch2res = rslt - ch2ran;
            if (ch2res <= 0) {
                ch2 = ch2ran - rslt;
            }
            else {
                ch2 = ch2res;
            }
            let ch3ran = getRandom(10, 99) * 10;
            let ch3res = rslt - ch3ran;
            if (ch3res <= 0) {
                ch3 = ch3ran - rslt;
            }
            else {
                ch3 = ch3res;
            }
        }


        //clean the numbers//amke sure none of them are same as result
        if (ch1 == rslt)
            ch1 = rslt + getRandom(1, 99);
        if (ch2 == rslt)
            ch2 = rslt + getRandom(1, 99);
        if (ch3 == rslt)
            ch3 = rslt + getRandom(1, 99);
        //TODO make sure none are same

        charr[0] = ch1;
        charr[1] = ch2;
        charr[2] = rslt;
        charr[3] = ch3;

        if (dmfactor == 1) {
            for (let i = 0; i < 4; i++) {
                charr[i] = charr[i].toFixed(2);
            }
        }
        else if (dmfactor != 0) {
            for (let i = 0; i < 4; i++) {
                charr[i] = charr[i] / dmfactor;
            }
        }

        //if decimal number then round and show 2 digits after decimal
        for (let i = 0; i < 4; i++) {
            if (charr[i] % 1 !== 0) {
                //charr[i] = parseFloat(Math.round(charr[i] * 100) / 100).toFixed(2);
                let dcnt = String(charr[i]).split(".")[1].length;
                charr[i] = "" + Number(Math.round(charr[i] + 'e' + dcnt) + 'e-' + dcnt).toFixed(2)

                // charr[i] = "" + Number(Math.round(charr[i] + 'e' + 3) + 'e-' + 3);
            }
            else {
                charr[i] = "" + charr[i];
            }
        }

        return getShuffle(charr);

        //make same pattern numbers
        //create digits matching last numbers, first numbers in the range
        //mix some other random numbers
        //select three wrong random numbers out of it
        // shugffle the answer with these random numbers

    }


    let getRandomByRules = function (datarule) {
        let rnd;
        //console.log("datfa rule is:" + JSON.stringify(datarule));
        //  rnd = getRandom(1, 99)
        let min, max;
        //min = Number(min);
        //max = Number(max);
        if (datarule === undefined) {
            min = 1;
            max = 99;
            rnd = getRandom(1, 99);
            return rnd;
        }
        if (datarule.values) {
            rnd = datarule.values[getRandom(0, datarule.values.length - 1)];
            return rnd;
        }
        else if (datarule.rng) {
            min = datarule.rng[0];
            max = datarule.rng[1];
            rnd = getRandom(min, max);
        }
        else {
            min = 1;
            max = 99;
            rnd = getRandom(1, 99);
            return rnd;
        }

        if (datarule.eqn && datarule.eqn != "") {
            if (datarule.eqn != "n") {
                // return rnd;
                // }
                // else {
                /*
                let evObjMini = new TapDigit.Evaluator();
                let equationmini = datarule.eqn;
                let datarulemini = JSON.parse(JSON.stringify(datarule));
             // if (equationmini.indexOf("/") > 0) {
               //     let divnum = Number(equationmini.split("/")[1]);
                //    datarulemini.rng[1] = Math.round(datarulemini.rng[1] / divnum);
                //    equationmini = equationmini.replace("/", "*");
               // }
               
                datarulemini.eqn = "";
                let dataruleobj = {};
                dataruleobj["n"] = datarulemini;
                evObjMini.evaluate(equationmini, dataruleobj);
                let ctxData = evObjMini.data();
                let results = evObjMini.results();
                console.log("random #:" + JSON.stringify(results));
                let myvl = results.main.Result;
                //  rnd = getRandom(1, 99)
                return myvl;
                */

                // debugger;
                let newdivchkeqn, neweqn, startNum;

                ////////////////added for decimals /////////////

                // let dcntmin = countDecimals(min);
                // let dcntmax = countDecimals(max);
                let dcntrnd = countDecimals(rnd);

                let dmfactor = 0;

                /*
                                if (dcntmin > 0 || dcntmax > 0) {
                                    if (dcntmax > dcntmin) {
                                        dmfactor = Math.pow(10, dcntmax);
                                    }
                                    else {
                                        dmfactor = Math.pow(10, dcntmin);
                                    }
                                }
                */

                if (dcntrnd > 0) {
                    dmfactor = Math.pow(10, dcntrnd);
                }

                if (dmfactor != 0) {
                    // max = max * dmfactor;
                    // min = min * dmfactor;
                    rnd = rnd * dmfactor;
                }
                ////////////////added for decimals /////////////
                startNum = rnd;
                rndNext = startNum;
                //init check for start number
                if (datarule.eqn.indexOf("/") > 0) {
                    newdivchkeqn = datarule.eqn.replace(/(\/)/g, function replacer(match, $1) {
                        return "*" + "";
                    });
                    neweqn = newdivchkeqn.replace(/(n)/g, function replacer(match, $1) {
                        return rnd + "";
                    });
                    rnd = eval(neweqn);

                    /*
                    while (eval(neweqn) !== 0) {
                        if (rnd < max) {
                            rnd = rnd + 1;
                            if (rnd == startNum) break;
                            ////////////////////////////////////
                            neweqn = newdivchkeqn.replace(/(n)/g, function replacer(match, $1) {
                                return rnd + "";
                            });
                            ////////////////////////////////////
                        }
                        else if (rnd == max) {
                            rnd = min;
                            if (rnd == startNum) break;
                            /////////////////////////////////////////
                            neweqn = newdivchkeqn.replace(/(n)/g, function replacer(match, $1) {
                                return rnd + "";
                            });

                        }
                    }  //end while
                    ///////////////////////////////////////////
                    if (eval(neweqn) !== 0) {
                        //alret no match
                    }
                    */
                }  //end division check
                else {  //other than division
                    neweqn = datarule.eqn.replace(/(n)/g, function replacer(match, $1) {
                        return rnd + "";
                    });
                    // console.log("neweqn:" + JSON.stringify(neweqn));
                    rnd = eval(neweqn);
                }
                // console.log("dmfactor:" + dmfactor);
                // console.log("rnd:" + JSON.stringify(rnd));

                if (dmfactor != 0) {
                    rnd = Number(rnd / dmfactor);
                    if (String(rnd).split(".").length == 1) {
                        return rnd.toFixed(2)
                    }
                    else {
                        return rnd;
                    }
                }

            }
        }  //data rule eqn exists
       // console.log("rnd:" + JSON.stringify(rnd));
        return rnd;
    }

    let countDecimals = function (value) {
        if (!isNaN(value)) {
            if (Math.floor(value) === value) return 0;
        }
        return value.toString().split(".")[1] ? value.toString().split(".")[1].length : 0 || 0;

    }

    let getRandom = function (min, max) {
        //avoid primes
        //  min = Number(min);
        //  max = Number(max);
        let dcntmin = countDecimals(min);
        let dcntmax = countDecimals(max);
        let dmfactor = 0;

        if (dcntmin > 0 || dcntmax > 0) {
            if (dcntmax > dcntmin) {
                dmfactor = Math.pow(10, dcntmax);
            }
            else {
                dmfactor = Math.pow(10, dcntmin);
            }
        }

        if (dmfactor != 0) {
            max = Number(max) * dmfactor;
            min = Number(min) * dmfactor;
        }
        else {
            max = Number(max);
            min = Number(min);
        }

        let rnd = Math.floor(Math.random() * (max - min + 1)) + min;
        // while (primes[rnd]) {
        //     rnd = Math.floor(Math.random() * (max - min + 1)) + min;
        // }

        if (dmfactor != 0) {
            rnd = Number(rnd / dmfactor);
            if (String(rnd).split(".").length == 1) {
                return rnd.toFixed(2)
            }
            else {
                return rnd;
            }
        }
        return rnd;
    };

    let getShuffle = function (array) {
        //pick randomly from shuffle on datarulesa
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    };

    let shuffleArray = function (array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    return {
        getRandom: getRandom,
        getRandomByRules: getRandomByRules,
        getRandomChoices: getRandomChoices,
        getShuffle: getShuffle,
        setPrimes: setPrimes,
        countDecimals: countDecimals,
        getRandomOperator: getRandomOperator,
        trm: trm
    }
};