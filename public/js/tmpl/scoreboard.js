define(function () { return function (__fest_context){"use strict";var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<section class=\"page\"><div class=\"content-wrapper\"><div class=\"content\"><h1 class=\"content__h1\">Frontend Game</h1><h2 class=\"content__h2\">Scoreboard</h2><div class=\"scores-wrapper\"><div class=\"loading-indicator scores-wrapper__loading-indicator\"></div>");try{__fest_if=json.scores.length != 0}catch(e){__fest_if=false;__fest_log_error(e.message);}if(__fest_if){__fest_buf+=("<table class=\"scores\"><tr class=\"scores__row\"><th class=\"scores__header\">#</th><th class=\"scores__header\">Player</th><th class=\"scores__header\">Score</th></tr>");var i,__fest_to0,__fest_iterator0;try{__fest_iterator0=json.scores || [];__fest_to0=__fest_iterator0.length;}catch(e){__fest_iterator0=[];__fest_to0=0;__fest_log_error(e.message);}for(i=0;i<__fest_to0;i++){__fest_buf+=("<tr class=\"scores__row\"><td class=\"scores__col\">");try{__fest_buf+=(__fest_escapeHTML(i+1))}catch(e){__fest_log_error(e.message + "19");}__fest_buf+=("</td><td class=\"scores__col\">");try{__fest_buf+=(__fest_escapeHTML(json.scores[i].name))}catch(e){__fest_log_error(e.message + "22");}__fest_buf+=("</td><td class=\"scores__col\">");try{__fest_buf+=(__fest_escapeHTML(json.scores[i].score))}catch(e){__fest_log_error(e.message + "25");}__fest_buf+=("</td></tr>");}__fest_buf+=("</table>");}__fest_buf+=("</div><a href=\"#main\" class=\"back-button\"><div class=\"left-arrow-wrapper\"><div class=\"left-arrow\"></div></div><span class=\"back-button__caption\">Menu</span></a></div><footer class=\"page-footer\"><div class=\"social-buttons\"></div><div class=\"github-wrapper\"><a href=\"https:\/\/github.com\/tech-team\/frontend-game\" class=\"github\" target=\"_blank\">See us on GitHub</a></div></footer></div></section>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });