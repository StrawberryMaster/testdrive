// Define the semantic elements which define sectioning content
const sectionElms = ["ARTICLE", "SECTION", "ASIDE", "NAV"];
const nonsectionElms = ["HGROUP", "HEADER", "FOOTER", "FIGURE", "FIGCAPTION", "ADDRESS"];
let hash = 3;

function addEvent(elm, evt, handler, useCapture = false) {
    // Use feature detection and add the event listener as best as possible
    if (elm.addEventListener) {
        // Standards-based event listener
        elm.addEventListener(evt, handler, useCapture);
    } else if (elm.attachEvent) {
        // Legacy IE event listener
        elm.attachEvent("on" + evt, handler);
    } else {
        // Fallback to event attributes. Unfortunately, event attribute will show up in markup editor.
        elm.setAttribute("on" + evt, handler);
    }
}
function removeAttr(root, attr) {
    var node = root;
    begin: while (node) {
        if (node.nodeType == 1 && node.removeAttribute)
            node.removeAttribute(attr);
        if (node.firstChild) {
            node = node.firstChild;
            continue begin;
        }
        while (node) {
            if (node.nextSibling) {
                node = node.nextSibling;
                continue begin;
            }
            if (node == root)
                node = null;
            else
                node = node.parentNode;
        }
    }
}
var walkTree = function (root, list, enter, exit) {
    var node = root;
    start: while (node) {
        list = enter(node, list);
        if (node.firstChild) {
            node = node.firstChild;
            continue start;
        }
        while (node) {
            list = exit(node, list);
            if (node.nextSibling) {
                node = node.nextSibling;
                continue start;
            }
            if (node == root)
                node = null;
            else
                node = node.parentNode;
        }
    }
    return list;
}
function highlightNotepadElm(e) {
    var id = this.firstChild.getAttribute("gotoHash");
    var notepadElm = document.getElementById(id);
    notepadElm.className = notepadElm.tagName;
    this.firstChild.style.fontWeight = "bold";
    this.firstChild.style.color = window.getComputedStyle(notepadElm, null).borderLeftColor;
}
function highlightOutlineElm(e) {
    e.currentTarget.className = e.currentTarget.tagName;
    if (sectionElms.indexOf(e.currentTarget.tagName) >= 0) {
        var outlineElm = document.getElementById("o" + e.currentTarget.id);
        outlineElm.style.fontWeight = "bold";
        outlineElm.style.color = window.getComputedStyle(e.currentTarget, null).borderLeftColor;
    }
}
function unHighlightNotepadElm(e) {
    var id = this.firstChild.getAttribute("gotoHash");
    var notepadElm = document.getElementById(id);
    notepadElm.className = "notepad";
    this.firstChild.style.fontWeight = "normal";//borderColor = "white";
    this.firstChild.style.color = "inherit";
}
function unHighlightOutlineElm(e) {
    if (sectionElms.indexOf(e.currentTarget.tagName) >= 0) {
        var outlineElm = document.getElementById("o" + this.id);
        outlineElm.style.fontWeight = "normal";//borderColor = "white";
        outlineElm.style.color = "inherit";
    }
    this.className = "notepad";
}
function doScroll(e) {
    window.location.hash = this.getAttribute("gotoHash");
    if (e.stopPropagation)
        e.stopPropagation();
    var evt = document.createEvent("MouseEvent");
    evt.initMouseEvent("mouseover", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    e.target.dispatchEvent(evt);

}
var enterNode = function (node, list) {
    if (node.nodeType == 1) {
        if (sectionElms.indexOf(node.tagName) >= 0) {
            var ni = document.createElement("LI");
            var sp = document.createElement("SPAN");
            sp.setAttribute("gotoHash", hash.toString());
            sp.setAttribute("id", "o" + hash.toString());
            ni.setAttribute("tabindex", hash.toString());
            node.className = "notepad";
            node.setAttribute("id", hash.toString());
            addEvent(sp, "click", doScroll);
            addEvent(ni, "mouseover", highlightNotepadElm);
            addEvent(ni, "mouseout", unHighlightNotepadElm);
            addEvent(ni, "focusin", highlightNotepadElm);
            addEvent(ni, "focusout", unHighlightNotepadElm);
            addEvent(node, "mouseover", highlightOutlineElm);
            addEvent(node, "mouseout", unHighlightOutlineElm);
            hash++;
            var tn = document.createTextNode(findHeadings(node));
            sp.appendChild(tn);
            ni.appendChild(sp);
            if (list.tagName == "LI") {
                var nl = document.createElement("OL");
                nl.appendChild(ni);
                list.appendChild(nl);
                list = ni;
            } else {
                list.appendChild(ni);
                list = ni;
            }
            addEvent(node, "mouseover", setElementStatus);
        } else if (nonsectionElms.indexOf(node.tagName) >= 0) {
            node.className = "notepad";
            addEvent(node, "mouseover", highlightOutlineElm);
            addEvent(node, "mouseout", unHighlightOutlineElm);
            addEvent(node, "mouseover", setElementStatus);
        }

    }
    return list;
}
var exitNode = function (node, list) {
    if (node.nodeType == 1 && sectionElms.indexOf(node.tagName) >= 0) {
        if (list.tagName == "OL")
            list = list.parentNode;
        list = list.parentNode;
    }
    return list;
}
var findHeadings = function (node) {
    //First check if this node has an <hgroup> which contains its headings
    var hg = node.getElementsByTagName("HGROUP");
    if (hg.length > 0)
        node = hg[0];
    //Now find the highest ranking heading
    var headings = node.getElementsByTagName("H1");
    if (headings.length > 0)
        return headings[0].textContent;
    var headings = node.getElementsByTagName("H2");
    if (headings.length > 0)
        return headings[0].textContent;
    var headings = node.getElementsByTagName("H3");
    if (headings.length > 0)
        return headings[0].textContent;
    var headings = node.getElementsByTagName("H4");
    if (headings.length > 0)
        return headings[0].textContent;
    var headings = node.getElementsByTagName("H5");
    if (headings.length > 0)
        return headings[0].textContent;
    var headings = node.getElementsByTagName("H6");
    if (headings.length > 0)
        return headings[0].textContent;
    //No headings present, return empty string
    return "";
}
function clearChildren(elm) {
    while (elm.childNodes.length >= 1)
        elm.removeChild(elm.firstChild);
}
function setElementStatus(e) {
    if (e && e.target.nodeType == 1) {
        var o = e.target;
        var s = "";
        while (!o.id || o.id != "notepad") {
            if (o.tagName)
                s = "&lt;" + o.tagName.toLowerCase() + "&gt;" + s;
            o = o.parentNode;
        }
        var status = document.getElementById("status");
        status.innerHTML = s;
    }
}
function clearStatus(e) {
    var status = document.getElementById("status");
    status.innerHTML = "";
}
function createOutline() {
    //Follows the HTML5 Outline algorithm to create a document outline from semantic elements
    var outline = document.getElementById("outline");
    clearChildren(outline);
    var list = document.createElement("OL");
    list.style.cursor = "pointer";
    hash = 3;
    outline.appendChild(list);
    var notepad = document.getElementById("notepad");
    walkTree(notepad.firstChild, list, enterNode, exitNode);
}
function showHideMarkup(e) {
    e.preventDefault();
    if (this.textContent == "Edit Markup") {
        this.textContent = "Save Markup";
        var notepad = document.getElementById("notepad");
        var markup = document.getElementById("markup");
        var outline = document.getElementById("outline");
        removeAttr(notepad, "class");
        markup.value = "";
        markup.value = notepad.innerHTML;
        //Get rid of the old notepad, we'll create a new one when we parse the textarea later
        clearChildren(notepad);
        notepad.style.display = "none";
        outline.style.opacity = 0.2;
        //Show the text area
        markup.style.display = "block";
        var status = document.getElementById("status");
        status.innerHTML = "Edit the markup and click &quot;Save Markup&quot; to view the updated outline.";
    } else {
        this.textContent = "Edit Markup";
        var markup = document.getElementById("markup");
        var notepad = document.getElementById("notepad");
        var outline = document.getElementById("outline");
        notepad.innerHTML = markup.value;
        //Show the notepad
        notepad.style.display = "block";
        //Hide the textarea
        markup.style.display = "none";
        createOutline();
        outline.style.opacity = 1;
        clearStatus();
    }
    if (e.stopPropagation)
        e.stopPropagation();
}
addEvent(window, "load", createOutline);
addEvent(document.getElementById("editor"), "keyup", createOutline);
addEvent(document.getElementById("toggleMarkup"), "click", showHideMarkup, true);
addEvent(document.getElementById("notepad"), "mouseout", clearStatus);
