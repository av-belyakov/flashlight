var jobLog =
webpackJsonp_name_([1],{

/***/ 14:
/***/ (function(module, exports) {

/* Chosen v1.8.7 | (c) 2011-2018 by Harvest | MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md */

(function(){var t,e,s,i,n=function(t,e){return function(){return t.apply(e,arguments)}},r=function(t,e){function s(){this.constructor=t}for(var i in e)o.call(e,i)&&(t[i]=e[i]);return s.prototype=e.prototype,t.prototype=new s,t.__super__=e.prototype,t},o={}.hasOwnProperty;(i=function(){function t(){this.options_index=0,this.parsed=[]}return t.prototype.add_node=function(t){return"OPTGROUP"===t.nodeName.toUpperCase()?this.add_group(t):this.add_option(t)},t.prototype.add_group=function(t){var e,s,i,n,r,o;for(e=this.parsed.length,this.parsed.push({array_index:e,group:!0,label:t.label,title:t.title?t.title:void 0,children:0,disabled:t.disabled,classes:t.className}),o=[],s=0,i=(r=t.childNodes).length;s<i;s++)n=r[s],o.push(this.add_option(n,e,t.disabled));return o},t.prototype.add_option=function(t,e,s){if("OPTION"===t.nodeName.toUpperCase())return""!==t.text?(null!=e&&(this.parsed[e].children+=1),this.parsed.push({array_index:this.parsed.length,options_index:this.options_index,value:t.value,text:t.text,html:t.innerHTML,title:t.title?t.title:void 0,selected:t.selected,disabled:!0===s?s:t.disabled,group_array_index:e,group_label:null!=e?this.parsed[e].label:null,classes:t.className,style:t.style.cssText})):this.parsed.push({array_index:this.parsed.length,options_index:this.options_index,empty:!0}),this.options_index+=1},t}()).select_to_array=function(t){var e,s,n,r,o;for(r=new i,s=0,n=(o=t.childNodes).length;s<n;s++)e=o[s],r.add_node(e);return r.parsed},e=function(){function t(e,s){this.form_field=e,this.options=null!=s?s:{},this.label_click_handler=n(this.label_click_handler,this),t.browser_is_supported()&&(this.is_multiple=this.form_field.multiple,this.set_default_text(),this.set_default_values(),this.setup(),this.set_up_html(),this.register_observers(),this.on_ready())}return t.prototype.set_default_values=function(){return this.click_test_action=function(t){return function(e){return t.test_active_click(e)}}(this),this.activate_action=function(t){return function(e){return t.activate_field(e)}}(this),this.active_field=!1,this.mouse_on_container=!1,this.results_showing=!1,this.result_highlighted=null,this.is_rtl=this.options.rtl||/\bchosen-rtl\b/.test(this.form_field.className),this.allow_single_deselect=null!=this.options.allow_single_deselect&&null!=this.form_field.options[0]&&""===this.form_field.options[0].text&&this.options.allow_single_deselect,this.disable_search_threshold=this.options.disable_search_threshold||0,this.disable_search=this.options.disable_search||!1,this.enable_split_word_search=null==this.options.enable_split_word_search||this.options.enable_split_word_search,this.group_search=null==this.options.group_search||this.options.group_search,this.search_contains=this.options.search_contains||!1,this.single_backstroke_delete=null==this.options.single_backstroke_delete||this.options.single_backstroke_delete,this.max_selected_options=this.options.max_selected_options||Infinity,this.inherit_select_classes=this.options.inherit_select_classes||!1,this.display_selected_options=null==this.options.display_selected_options||this.options.display_selected_options,this.display_disabled_options=null==this.options.display_disabled_options||this.options.display_disabled_options,this.include_group_label_in_selected=this.options.include_group_label_in_selected||!1,this.max_shown_results=this.options.max_shown_results||Number.POSITIVE_INFINITY,this.case_sensitive_search=this.options.case_sensitive_search||!1,this.hide_results_on_select=null==this.options.hide_results_on_select||this.options.hide_results_on_select},t.prototype.set_default_text=function(){return this.form_field.getAttribute("data-placeholder")?this.default_text=this.form_field.getAttribute("data-placeholder"):this.is_multiple?this.default_text=this.options.placeholder_text_multiple||this.options.placeholder_text||t.default_multiple_text:this.default_text=this.options.placeholder_text_single||this.options.placeholder_text||t.default_single_text,this.default_text=this.escape_html(this.default_text),this.results_none_found=this.form_field.getAttribute("data-no_results_text")||this.options.no_results_text||t.default_no_result_text},t.prototype.choice_label=function(t){return this.include_group_label_in_selected&&null!=t.group_label?"<b class='group-name'>"+this.escape_html(t.group_label)+"</b>"+t.html:t.html},t.prototype.mouse_enter=function(){return this.mouse_on_container=!0},t.prototype.mouse_leave=function(){return this.mouse_on_container=!1},t.prototype.input_focus=function(t){if(this.is_multiple){if(!this.active_field)return setTimeout(function(t){return function(){return t.container_mousedown()}}(this),50)}else if(!this.active_field)return this.activate_field()},t.prototype.input_blur=function(t){if(!this.mouse_on_container)return this.active_field=!1,setTimeout(function(t){return function(){return t.blur_test()}}(this),100)},t.prototype.label_click_handler=function(t){return this.is_multiple?this.container_mousedown(t):this.activate_field()},t.prototype.results_option_build=function(t){var e,s,i,n,r,o,h;for(e="",h=0,n=0,r=(o=this.results_data).length;n<r&&(s=o[n],i="",""!==(i=s.group?this.result_add_group(s):this.result_add_option(s))&&(h++,e+=i),(null!=t?t.first:void 0)&&(s.selected&&this.is_multiple?this.choice_build(s):s.selected&&!this.is_multiple&&this.single_set_selected_text(this.choice_label(s))),!(h>=this.max_shown_results));n++);return e},t.prototype.result_add_option=function(t){var e,s;return t.search_match&&this.include_option_in_results(t)?(e=[],t.disabled||t.selected&&this.is_multiple||e.push("active-result"),!t.disabled||t.selected&&this.is_multiple||e.push("disabled-result"),t.selected&&e.push("result-selected"),null!=t.group_array_index&&e.push("group-option"),""!==t.classes&&e.push(t.classes),s=document.createElement("li"),s.className=e.join(" "),t.style&&(s.style.cssText=t.style),s.setAttribute("data-option-array-index",t.array_index),s.innerHTML=t.highlighted_html||t.html,t.title&&(s.title=t.title),this.outerHTML(s)):""},t.prototype.result_add_group=function(t){var e,s;return(t.search_match||t.group_match)&&t.active_options>0?((e=[]).push("group-result"),t.classes&&e.push(t.classes),s=document.createElement("li"),s.className=e.join(" "),s.innerHTML=t.highlighted_html||this.escape_html(t.label),t.title&&(s.title=t.title),this.outerHTML(s)):""},t.prototype.results_update_field=function(){if(this.set_default_text(),this.is_multiple||this.results_reset_cleanup(),this.result_clear_highlight(),this.results_build(),this.results_showing)return this.winnow_results()},t.prototype.reset_single_select_options=function(){var t,e,s,i,n;for(n=[],t=0,e=(s=this.results_data).length;t<e;t++)(i=s[t]).selected?n.push(i.selected=!1):n.push(void 0);return n},t.prototype.results_toggle=function(){return this.results_showing?this.results_hide():this.results_show()},t.prototype.results_search=function(t){return this.results_showing?this.winnow_results():this.results_show()},t.prototype.winnow_results=function(t){var e,s,i,n,r,o,h,l,c,_,a,u,d,p,f;for(this.no_results_clear(),_=0,e=(h=this.get_search_text()).replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&"),c=this.get_search_regex(e),i=0,n=(l=this.results_data).length;i<n;i++)(r=l[i]).search_match=!1,a=null,u=null,r.highlighted_html="",this.include_option_in_results(r)&&(r.group&&(r.group_match=!1,r.active_options=0),null!=r.group_array_index&&this.results_data[r.group_array_index]&&(0===(a=this.results_data[r.group_array_index]).active_options&&a.search_match&&(_+=1),a.active_options+=1),f=r.group?r.label:r.text,r.group&&!this.group_search||(u=this.search_string_match(f,c),r.search_match=null!=u,r.search_match&&!r.group&&(_+=1),r.search_match?(h.length&&(d=u.index,o=f.slice(0,d),s=f.slice(d,d+h.length),p=f.slice(d+h.length),r.highlighted_html=this.escape_html(o)+"<em>"+this.escape_html(s)+"</em>"+this.escape_html(p)),null!=a&&(a.group_match=!0)):null!=r.group_array_index&&this.results_data[r.group_array_index].search_match&&(r.search_match=!0)));return this.result_clear_highlight(),_<1&&h.length?(this.update_results_content(""),this.no_results(h)):(this.update_results_content(this.results_option_build()),(null!=t?t.skip_highlight:void 0)?void 0:this.winnow_results_set_highlight())},t.prototype.get_search_regex=function(t){var e,s;return s=this.search_contains?t:"(^|\\s|\\b)"+t+"[^\\s]*",this.enable_split_word_search||this.search_contains||(s="^"+s),e=this.case_sensitive_search?"":"i",new RegExp(s,e)},t.prototype.search_string_match=function(t,e){var s;return s=e.exec(t),!this.search_contains&&(null!=s?s[1]:void 0)&&(s.index+=1),s},t.prototype.choices_count=function(){var t,e,s;if(null!=this.selected_option_count)return this.selected_option_count;for(this.selected_option_count=0,t=0,e=(s=this.form_field.options).length;t<e;t++)s[t].selected&&(this.selected_option_count+=1);return this.selected_option_count},t.prototype.choices_click=function(t){if(t.preventDefault(),this.activate_field(),!this.results_showing&&!this.is_disabled)return this.results_show()},t.prototype.keydown_checker=function(t){var e,s;switch(s=null!=(e=t.which)?e:t.keyCode,this.search_field_scale(),8!==s&&this.pending_backstroke&&this.clear_backstroke(),s){case 8:this.backstroke_length=this.get_search_field_value().length;break;case 9:this.results_showing&&!this.is_multiple&&this.result_select(t),this.mouse_on_container=!1;break;case 13:case 27:this.results_showing&&t.preventDefault();break;case 32:this.disable_search&&t.preventDefault();break;case 38:t.preventDefault(),this.keyup_arrow();break;case 40:t.preventDefault(),this.keydown_arrow()}},t.prototype.keyup_checker=function(t){var e,s;switch(s=null!=(e=t.which)?e:t.keyCode,this.search_field_scale(),s){case 8:this.is_multiple&&this.backstroke_length<1&&this.choices_count()>0?this.keydown_backstroke():this.pending_backstroke||(this.result_clear_highlight(),this.results_search());break;case 13:t.preventDefault(),this.results_showing&&this.result_select(t);break;case 27:this.results_showing&&this.results_hide();break;case 9:case 16:case 17:case 18:case 38:case 40:case 91:break;default:this.results_search()}},t.prototype.clipboard_event_checker=function(t){if(!this.is_disabled)return setTimeout(function(t){return function(){return t.results_search()}}(this),50)},t.prototype.container_width=function(){return null!=this.options.width?this.options.width:this.form_field.offsetWidth+"px"},t.prototype.include_option_in_results=function(t){return!(this.is_multiple&&!this.display_selected_options&&t.selected)&&(!(!this.display_disabled_options&&t.disabled)&&!t.empty)},t.prototype.search_results_touchstart=function(t){return this.touch_started=!0,this.search_results_mouseover(t)},t.prototype.search_results_touchmove=function(t){return this.touch_started=!1,this.search_results_mouseout(t)},t.prototype.search_results_touchend=function(t){if(this.touch_started)return this.search_results_mouseup(t)},t.prototype.outerHTML=function(t){var e;return t.outerHTML?t.outerHTML:((e=document.createElement("div")).appendChild(t),e.innerHTML)},t.prototype.get_single_html=function(){return'<a class="chosen-single chosen-default">\n  <span>'+this.default_text+'</span>\n  <div><b></b></div>\n</a>\n<div class="chosen-drop">\n  <div class="chosen-search">\n    <input class="chosen-search-input" type="text" autocomplete="off" />\n  </div>\n  <ul class="chosen-results"></ul>\n</div>'},t.prototype.get_multi_html=function(){return'<ul class="chosen-choices">\n  <li class="search-field">\n    <input class="chosen-search-input" type="text" autocomplete="off" value="'+this.default_text+'" />\n  </li>\n</ul>\n<div class="chosen-drop">\n  <ul class="chosen-results"></ul>\n</div>'},t.prototype.get_no_results_html=function(t){return'<li class="no-results">\n  '+this.results_none_found+" <span>"+this.escape_html(t)+"</span>\n</li>"},t.browser_is_supported=function(){return"Microsoft Internet Explorer"===window.navigator.appName?document.documentMode>=8:!(/iP(od|hone)/i.test(window.navigator.userAgent)||/IEMobile/i.test(window.navigator.userAgent)||/Windows Phone/i.test(window.navigator.userAgent)||/BlackBerry/i.test(window.navigator.userAgent)||/BB10/i.test(window.navigator.userAgent)||/Android.*Mobile/i.test(window.navigator.userAgent))},t.default_multiple_text="Select Some Options",t.default_single_text="Select an Option",t.default_no_result_text="No results match",t}(),(t=jQuery).fn.extend({chosen:function(i){return e.browser_is_supported()?this.each(function(e){var n,r;r=(n=t(this)).data("chosen"),"destroy"!==i?r instanceof s||n.data("chosen",new s(this,i)):r instanceof s&&r.destroy()}):this}}),s=function(s){function n(){return n.__super__.constructor.apply(this,arguments)}return r(n,e),n.prototype.setup=function(){return this.form_field_jq=t(this.form_field),this.current_selectedIndex=this.form_field.selectedIndex},n.prototype.set_up_html=function(){var e,s;return(e=["chosen-container"]).push("chosen-container-"+(this.is_multiple?"multi":"single")),this.inherit_select_classes&&this.form_field.className&&e.push(this.form_field.className),this.is_rtl&&e.push("chosen-rtl"),s={"class":e.join(" "),title:this.form_field.title},this.form_field.id.length&&(s.id=this.form_field.id.replace(/[^\w]/g,"_")+"_chosen"),this.container=t("<div />",s),this.container.width(this.container_width()),this.is_multiple?this.container.html(this.get_multi_html()):this.container.html(this.get_single_html()),this.form_field_jq.hide().after(this.container),this.dropdown=this.container.find("div.chosen-drop").first(),this.search_field=this.container.find("input").first(),this.search_results=this.container.find("ul.chosen-results").first(),this.search_field_scale(),this.search_no_results=this.container.find("li.no-results").first(),this.is_multiple?(this.search_choices=this.container.find("ul.chosen-choices").first(),this.search_container=this.container.find("li.search-field").first()):(this.search_container=this.container.find("div.chosen-search").first(),this.selected_item=this.container.find(".chosen-single").first()),this.results_build(),this.set_tab_index(),this.set_label_behavior()},n.prototype.on_ready=function(){return this.form_field_jq.trigger("chosen:ready",{chosen:this})},n.prototype.register_observers=function(){return this.container.on("touchstart.chosen",function(t){return function(e){t.container_mousedown(e)}}(this)),this.container.on("touchend.chosen",function(t){return function(e){t.container_mouseup(e)}}(this)),this.container.on("mousedown.chosen",function(t){return function(e){t.container_mousedown(e)}}(this)),this.container.on("mouseup.chosen",function(t){return function(e){t.container_mouseup(e)}}(this)),this.container.on("mouseenter.chosen",function(t){return function(e){t.mouse_enter(e)}}(this)),this.container.on("mouseleave.chosen",function(t){return function(e){t.mouse_leave(e)}}(this)),this.search_results.on("mouseup.chosen",function(t){return function(e){t.search_results_mouseup(e)}}(this)),this.search_results.on("mouseover.chosen",function(t){return function(e){t.search_results_mouseover(e)}}(this)),this.search_results.on("mouseout.chosen",function(t){return function(e){t.search_results_mouseout(e)}}(this)),this.search_results.on("mousewheel.chosen DOMMouseScroll.chosen",function(t){return function(e){t.search_results_mousewheel(e)}}(this)),this.search_results.on("touchstart.chosen",function(t){return function(e){t.search_results_touchstart(e)}}(this)),this.search_results.on("touchmove.chosen",function(t){return function(e){t.search_results_touchmove(e)}}(this)),this.search_results.on("touchend.chosen",function(t){return function(e){t.search_results_touchend(e)}}(this)),this.form_field_jq.on("chosen:updated.chosen",function(t){return function(e){t.results_update_field(e)}}(this)),this.form_field_jq.on("chosen:activate.chosen",function(t){return function(e){t.activate_field(e)}}(this)),this.form_field_jq.on("chosen:open.chosen",function(t){return function(e){t.container_mousedown(e)}}(this)),this.form_field_jq.on("chosen:close.chosen",function(t){return function(e){t.close_field(e)}}(this)),this.search_field.on("blur.chosen",function(t){return function(e){t.input_blur(e)}}(this)),this.search_field.on("keyup.chosen",function(t){return function(e){t.keyup_checker(e)}}(this)),this.search_field.on("keydown.chosen",function(t){return function(e){t.keydown_checker(e)}}(this)),this.search_field.on("focus.chosen",function(t){return function(e){t.input_focus(e)}}(this)),this.search_field.on("cut.chosen",function(t){return function(e){t.clipboard_event_checker(e)}}(this)),this.search_field.on("paste.chosen",function(t){return function(e){t.clipboard_event_checker(e)}}(this)),this.is_multiple?this.search_choices.on("click.chosen",function(t){return function(e){t.choices_click(e)}}(this)):this.container.on("click.chosen",function(t){t.preventDefault()})},n.prototype.destroy=function(){return t(this.container[0].ownerDocument).off("click.chosen",this.click_test_action),this.form_field_label.length>0&&this.form_field_label.off("click.chosen"),this.search_field[0].tabIndex&&(this.form_field_jq[0].tabIndex=this.search_field[0].tabIndex),this.container.remove(),this.form_field_jq.removeData("chosen"),this.form_field_jq.show()},n.prototype.search_field_disabled=function(){return this.is_disabled=this.form_field.disabled||this.form_field_jq.parents("fieldset").is(":disabled"),this.container.toggleClass("chosen-disabled",this.is_disabled),this.search_field[0].disabled=this.is_disabled,this.is_multiple||this.selected_item.off("focus.chosen",this.activate_field),this.is_disabled?this.close_field():this.is_multiple?void 0:this.selected_item.on("focus.chosen",this.activate_field)},n.prototype.container_mousedown=function(e){var s;if(!this.is_disabled)return!e||"mousedown"!==(s=e.type)&&"touchstart"!==s||this.results_showing||e.preventDefault(),null!=e&&t(e.target).hasClass("search-choice-close")?void 0:(this.active_field?this.is_multiple||!e||t(e.target)[0]!==this.selected_item[0]&&!t(e.target).parents("a.chosen-single").length||(e.preventDefault(),this.results_toggle()):(this.is_multiple&&this.search_field.val(""),t(this.container[0].ownerDocument).on("click.chosen",this.click_test_action),this.results_show()),this.activate_field())},n.prototype.container_mouseup=function(t){if("ABBR"===t.target.nodeName&&!this.is_disabled)return this.results_reset(t)},n.prototype.search_results_mousewheel=function(t){var e;if(t.originalEvent&&(e=t.originalEvent.deltaY||-t.originalEvent.wheelDelta||t.originalEvent.detail),null!=e)return t.preventDefault(),"DOMMouseScroll"===t.type&&(e*=40),this.search_results.scrollTop(e+this.search_results.scrollTop())},n.prototype.blur_test=function(t){if(!this.active_field&&this.container.hasClass("chosen-container-active"))return this.close_field()},n.prototype.close_field=function(){return t(this.container[0].ownerDocument).off("click.chosen",this.click_test_action),this.active_field=!1,this.results_hide(),this.container.removeClass("chosen-container-active"),this.clear_backstroke(),this.show_search_field_default(),this.search_field_scale(),this.search_field.blur()},n.prototype.activate_field=function(){if(!this.is_disabled)return this.container.addClass("chosen-container-active"),this.active_field=!0,this.search_field.val(this.search_field.val()),this.search_field.focus()},n.prototype.test_active_click=function(e){var s;return(s=t(e.target).closest(".chosen-container")).length&&this.container[0]===s[0]?this.active_field=!0:this.close_field()},n.prototype.results_build=function(){return this.parsing=!0,this.selected_option_count=null,this.results_data=i.select_to_array(this.form_field),this.is_multiple?this.search_choices.find("li.search-choice").remove():(this.single_set_selected_text(),this.disable_search||this.form_field.options.length<=this.disable_search_threshold?(this.search_field[0].readOnly=!0,this.container.addClass("chosen-container-single-nosearch")):(this.search_field[0].readOnly=!1,this.container.removeClass("chosen-container-single-nosearch"))),this.update_results_content(this.results_option_build({first:!0})),this.search_field_disabled(),this.show_search_field_default(),this.search_field_scale(),this.parsing=!1},n.prototype.result_do_highlight=function(t){var e,s,i,n,r;if(t.length){if(this.result_clear_highlight(),this.result_highlight=t,this.result_highlight.addClass("highlighted"),i=parseInt(this.search_results.css("maxHeight"),10),r=this.search_results.scrollTop(),n=i+r,s=this.result_highlight.position().top+this.search_results.scrollTop(),(e=s+this.result_highlight.outerHeight())>=n)return this.search_results.scrollTop(e-i>0?e-i:0);if(s<r)return this.search_results.scrollTop(s)}},n.prototype.result_clear_highlight=function(){return this.result_highlight&&this.result_highlight.removeClass("highlighted"),this.result_highlight=null},n.prototype.results_show=function(){return this.is_multiple&&this.max_selected_options<=this.choices_count()?(this.form_field_jq.trigger("chosen:maxselected",{chosen:this}),!1):(this.container.addClass("chosen-with-drop"),this.results_showing=!0,this.search_field.focus(),this.search_field.val(this.get_search_field_value()),this.winnow_results(),this.form_field_jq.trigger("chosen:showing_dropdown",{chosen:this}))},n.prototype.update_results_content=function(t){return this.search_results.html(t)},n.prototype.results_hide=function(){return this.results_showing&&(this.result_clear_highlight(),this.container.removeClass("chosen-with-drop"),this.form_field_jq.trigger("chosen:hiding_dropdown",{chosen:this})),this.results_showing=!1},n.prototype.set_tab_index=function(t){var e;if(this.form_field.tabIndex)return e=this.form_field.tabIndex,this.form_field.tabIndex=-1,this.search_field[0].tabIndex=e},n.prototype.set_label_behavior=function(){if(this.form_field_label=this.form_field_jq.parents("label"),!this.form_field_label.length&&this.form_field.id.length&&(this.form_field_label=t("label[for='"+this.form_field.id+"']")),this.form_field_label.length>0)return this.form_field_label.on("click.chosen",this.label_click_handler)},n.prototype.show_search_field_default=function(){return this.is_multiple&&this.choices_count()<1&&!this.active_field?(this.search_field.val(this.default_text),this.search_field.addClass("default")):(this.search_field.val(""),this.search_field.removeClass("default"))},n.prototype.search_results_mouseup=function(e){var s;if((s=t(e.target).hasClass("active-result")?t(e.target):t(e.target).parents(".active-result").first()).length)return this.result_highlight=s,this.result_select(e),this.search_field.focus()},n.prototype.search_results_mouseover=function(e){var s;if(s=t(e.target).hasClass("active-result")?t(e.target):t(e.target).parents(".active-result").first())return this.result_do_highlight(s)},n.prototype.search_results_mouseout=function(e){if(t(e.target).hasClass("active-result")||t(e.target).parents(".active-result").first())return this.result_clear_highlight()},n.prototype.choice_build=function(e){var s,i;return s=t("<li />",{"class":"search-choice"}).html("<span>"+this.choice_label(e)+"</span>"),e.disabled?s.addClass("search-choice-disabled"):((i=t("<a />",{"class":"search-choice-close","data-option-array-index":e.array_index})).on("click.chosen",function(t){return function(e){return t.choice_destroy_link_click(e)}}(this)),s.append(i)),this.search_container.before(s)},n.prototype.choice_destroy_link_click=function(e){if(e.preventDefault(),e.stopPropagation(),!this.is_disabled)return this.choice_destroy(t(e.target))},n.prototype.choice_destroy=function(t){if(this.result_deselect(t[0].getAttribute("data-option-array-index")))return this.active_field?this.search_field.focus():this.show_search_field_default(),this.is_multiple&&this.choices_count()>0&&this.get_search_field_value().length<1&&this.results_hide(),t.parents("li").first().remove(),this.search_field_scale()},n.prototype.results_reset=function(){if(this.reset_single_select_options(),this.form_field.options[0].selected=!0,this.single_set_selected_text(),this.show_search_field_default(),this.results_reset_cleanup(),this.trigger_form_field_change(),this.active_field)return this.results_hide()},n.prototype.results_reset_cleanup=function(){return this.current_selectedIndex=this.form_field.selectedIndex,this.selected_item.find("abbr").remove()},n.prototype.result_select=function(t){var e,s;if(this.result_highlight)return e=this.result_highlight,this.result_clear_highlight(),this.is_multiple&&this.max_selected_options<=this.choices_count()?(this.form_field_jq.trigger("chosen:maxselected",{chosen:this}),!1):(this.is_multiple?e.removeClass("active-result"):this.reset_single_select_options(),e.addClass("result-selected"),s=this.results_data[e[0].getAttribute("data-option-array-index")],s.selected=!0,this.form_field.options[s.options_index].selected=!0,this.selected_option_count=null,this.is_multiple?this.choice_build(s):this.single_set_selected_text(this.choice_label(s)),this.is_multiple&&(!this.hide_results_on_select||t.metaKey||t.ctrlKey)?t.metaKey||t.ctrlKey?this.winnow_results({skip_highlight:!0}):(this.search_field.val(""),this.winnow_results()):(this.results_hide(),this.show_search_field_default()),(this.is_multiple||this.form_field.selectedIndex!==this.current_selectedIndex)&&this.trigger_form_field_change({selected:this.form_field.options[s.options_index].value}),this.current_selectedIndex=this.form_field.selectedIndex,t.preventDefault(),this.search_field_scale())},n.prototype.single_set_selected_text=function(t){return null==t&&(t=this.default_text),t===this.default_text?this.selected_item.addClass("chosen-default"):(this.single_deselect_control_build(),this.selected_item.removeClass("chosen-default")),this.selected_item.find("span").html(t)},n.prototype.result_deselect=function(t){var e;return e=this.results_data[t],!this.form_field.options[e.options_index].disabled&&(e.selected=!1,this.form_field.options[e.options_index].selected=!1,this.selected_option_count=null,this.result_clear_highlight(),this.results_showing&&this.winnow_results(),this.trigger_form_field_change({deselected:this.form_field.options[e.options_index].value}),this.search_field_scale(),!0)},n.prototype.single_deselect_control_build=function(){if(this.allow_single_deselect)return this.selected_item.find("abbr").length||this.selected_item.find("span").first().after('<abbr class="search-choice-close"></abbr>'),this.selected_item.addClass("chosen-single-with-deselect")},n.prototype.get_search_field_value=function(){return this.search_field.val()},n.prototype.get_search_text=function(){return t.trim(this.get_search_field_value())},n.prototype.escape_html=function(e){return t("<div/>").text(e).html()},n.prototype.winnow_results_set_highlight=function(){var t,e;if(e=this.is_multiple?[]:this.search_results.find(".result-selected.active-result"),null!=(t=e.length?e.first():this.search_results.find(".active-result").first()))return this.result_do_highlight(t)},n.prototype.no_results=function(t){var e;return e=this.get_no_results_html(t),this.search_results.append(e),this.form_field_jq.trigger("chosen:no_results",{chosen:this})},n.prototype.no_results_clear=function(){return this.search_results.find(".no-results").remove()},n.prototype.keydown_arrow=function(){var t;return this.results_showing&&this.result_highlight?(t=this.result_highlight.nextAll("li.active-result").first())?this.result_do_highlight(t):void 0:this.results_show()},n.prototype.keyup_arrow=function(){var t;return this.results_showing||this.is_multiple?this.result_highlight?(t=this.result_highlight.prevAll("li.active-result")).length?this.result_do_highlight(t.first()):(this.choices_count()>0&&this.results_hide(),this.result_clear_highlight()):void 0:this.results_show()},n.prototype.keydown_backstroke=function(){var t;return this.pending_backstroke?(this.choice_destroy(this.pending_backstroke.find("a").first()),this.clear_backstroke()):(t=this.search_container.siblings("li.search-choice").last()).length&&!t.hasClass("search-choice-disabled")?(this.pending_backstroke=t,this.single_backstroke_delete?this.keydown_backstroke():this.pending_backstroke.addClass("search-choice-focus")):void 0},n.prototype.clear_backstroke=function(){return this.pending_backstroke&&this.pending_backstroke.removeClass("search-choice-focus"),this.pending_backstroke=null},n.prototype.search_field_scale=function(){var e,s,i,n,r,o,h;if(this.is_multiple){for(r={position:"absolute",left:"-1000px",top:"-1000px",display:"none",whiteSpace:"pre"},s=0,i=(o=["fontSize","fontStyle","fontWeight","fontFamily","lineHeight","textTransform","letterSpacing"]).length;s<i;s++)r[n=o[s]]=this.search_field.css(n);return(e=t("<div />").css(r)).text(this.get_search_field_value()),t("body").append(e),h=e.width()+25,e.remove(),this.container.is(":visible")&&(h=Math.min(this.container.outerWidth()-10,h)),this.search_field.width(h)}},n.prototype.trigger_form_field_change=function(t){return this.form_field_jq.trigger("input",t),this.form_field_jq.trigger("change",t)},n}()}).call(this);

/***/ }),

/***/ 158:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_showNotify__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__common__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__common___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__common__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__job_log_submitQuery__ = __webpack_require__(97);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__job_log_getSelectedList__ = __webpack_require__(159);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__commons_processPagination__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__job_log_changeObjectStatus__ = __webpack_require__(160);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__job_log_openModalWindowDelete__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__job_log_requestDownloadAllFiles__ = __webpack_require__(161);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__job_log_requestDownloadChooseFiles__ = __webpack_require__(162);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__job_log_createTableTaskResultFilter__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__commons_getBodyJournalOfFiltrations__ = __webpack_require__(53);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__commons_createModalWindowFilterResults__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__job_log_createModalWindowListDownloadFiles__ = __webpack_require__(163);


__webpack_require__(14);















(function () {
    //загрузка отфильтрованного сетевого трафика
    function importFiles(taskIndex) {
        socket.emit('get list all files obtained result filtering', { processingType: 'importFiles', taskIndex: taskIndex });
    }

    //пользователь не авторизован
    socket.on('error authentication user', function () {
        window.location.reload();
    });

    socket.on('notify information', function (data) {
        let obj = JSON.parse(data.notify);
        Object(__WEBPACK_IMPORTED_MODULE_0__common_helpers_showNotify__["a" /* showNotify */])(obj.type, obj.message);
    });

    socket.on('show new page', function (data) {
        Object(__WEBPACK_IMPORTED_MODULE_9__job_log_createTableTaskResultFilter__["a" /* default */])(data);
    });

    //вывод подробной информации о задаче на фильтрацию
    socket.on('all information for task index', function (data) {
        Object(__WEBPACK_IMPORTED_MODULE_11__commons_createModalWindowFilterResults__["a" /* default */])(data);
    });

    //вывод списка найденных файлов
    socket.on('list all files obtained result filtering', function (data) {
        Object(__WEBPACK_IMPORTED_MODULE_12__job_log_createModalWindowListDownloadFiles__["a" /* default */])(data);
    });

    socket.on('found all tasks Index', function (data) {
        if (!data.hasOwnProperty('selectList')) return;
        if (!data.hasOwnProperty('informationTasks')) return;

        //очищаем поля формы ввода даты и времени
        document.getElementById('dateTimeStart').firstElementChild.value = '';
        document.getElementById('dateTimeEnd').firstElementChild.value = '';

        //строим выпадающий список
        Object(__WEBPACK_IMPORTED_MODULE_3__job_log_getSelectedList__["a" /* default */])(data.selectList);
        $('.chosen-select').chosen({ width: '550px' });

        //формируем таблицу с данными и пагинатор
        Object(__WEBPACK_IMPORTED_MODULE_10__commons_getBodyJournalOfFiltrations__["a" /* default */])('job_log', data.informationTasks);
    });

    //изменение статуса заданного объекта
    socket.on('change object status', function (data) {
        Object(__WEBPACK_IMPORTED_MODULE_5__job_log_changeObjectStatus__["a" /* default */])(data);
    });

    //обновляем количество загруженных найденных файлов
    socket.on('filtering execute', function (data) {
        let trElement = document.getElementById('task_' + data.information.taskIndex);
        if (trElement === null) return;

        let countFilesFound = +data.information.countFilesFound === 0 ? data.information.countFilesFound : `<strong>${data.information.countFilesFound}</strong>`;

        trElement.querySelectorAll('td')[7].innerHTML = countFilesFound;
        let taskInformation = trElement.querySelector('input[type="hidden"]').dataset.taskinformation;
        if (~taskInformation.indexOf(':')) {
            let dataAccessRights = taskInformation.split(':')[0];

            trElement.querySelector('input[type="hidden"]').dataset.taskinformation = dataAccessRights + ':' + data.information.countFilesFound;
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        //обработчик на кнопку 'импорт'
        (function () {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonImport"]');
            buttonsImport.forEach(element => {
                let taskIndex = element.parentElement.dataset.taskIndex;
                element.onclick = importFiles.bind(null, taskIndex);
            });
        })();

        //обработчик на кнопку 'удалить'
        (function () {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonDelete"]');
            buttonsImport.forEach(element => {
                let taskIndex = element.parentElement.dataset.taskIndex;
                element.onclick = __WEBPACK_IMPORTED_MODULE_6__job_log_openModalWindowDelete__["a" /* default */].bind(null, taskIndex);
            });
        })();

        //обработчик на кнопку 'полная информация'
        (function () {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonAllInformation"]');
            buttonsImport.forEach(element => {
                let taskIndex = element.parentElement.dataset.taskIndex;
                element.onclick = function (taskIndex) {
                    socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
                }.bind(null, taskIndex);
            });
        })();

        //Обработчик на постраничные ссылки
        (function () {
            let divPagination = document.getElementsByClassName('pagination')[0];
            if (typeof divPagination !== 'undefined') divPagination.addEventListener('click', __WEBPACK_IMPORTED_MODULE_4__commons_processPagination__["a" /* default */].bind('show the page number filtering'));
        })();

        //Обработчик на кнопку 'Поиск'
        (function () {
            let buttonSearch = document.getElementById('buttonSearch');
            if (typeof buttonSearch !== 'undefined') buttonSearch.addEventListener('click', __WEBPACK_IMPORTED_MODULE_2__job_log_submitQuery__["a" /* default */]);
        })();

        //Обработчик на кнопку 'Удалить' модального окна
        (function () {
            document.querySelector('#modalDelete .btn-primary').addEventListener('click', function () {
                let taskIndex = document.querySelector('#modalDelete .modal-body p').dataset.taskIndex;

                socket.emit('delete all information for task index', { processingType: 'deleteTaskIndex', taskIndex: taskIndex });
                //закрыть модальное окно
                $('#modalDelete').modal('hide');

                setTimeout(function () {
                    window.location.reload();
                }, 5000);
            });
        })();

        //обработчик на кнопку 'скачать все'
        (function () {
            document.querySelector('#modalListDownloadFiles .btn-primary').addEventListener('click', function () {
                Object(__WEBPACK_IMPORTED_MODULE_7__job_log_requestDownloadAllFiles__["a" /* default */])(socket);
            });
        })();

        //обработчик на кнопку 'скачать выбранное'
        (function () {
            document.querySelector('#modalListDownloadFiles .btn-default').addEventListener('click', function () {
                Object(__WEBPACK_IMPORTED_MODULE_8__job_log_requestDownloadChooseFiles__["a" /* default */])(socket);
            });
        })();

        __WEBPACK_IMPORTED_MODULE_1__common___default.a.toolTip();

        $('.chosen-select').chosen({ width: '550px' });

        $(function () {
            $('#dateTimeStart').datetimepicker({ locale: 'ru' });
            $('#dateTimeEnd').datetimepicker({ locale: 'ru' });
        });
    });
})();

/***/ }),

/***/ 159:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = getSelectedList;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__submitQuery__ = __webpack_require__(97);
/**
 * Посторение выподающего списка
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */





function getSelectedList(obj) {
    let divSelectList = document.getElementById('selectList');
    let objName = {
        'statusFilter': 'СТАТУС ЗАДАЧИ',
        'statusImport': 'СТАТУС ИМПОРТА',
        'users': 'ПОЛЬЗОВАТЕЛИ',
        'sourceIndex': 'ИСТОЧНИКИ'
    };

    let selectInput = '<select data-placeholder="параметры поиска" style="display: none;" class="chosen-select" multiple="" tabindex="-1"><option value=""></option>';
    for (let type in obj) {
        selectInput += `<optgroup label="${objName[type]}">`;
        for (let item in obj[type]) {
            if (type === 'sourceIndex') selectInput += `<option value="${type}:${item}">${item} ${obj[type][item]}</option>`;else selectInput += `<option value="${type}:${item}">${obj[type][item]}</option>`;
        }
        selectInput += '</optgroup>';
    }
    selectInput += '</select> <button type="submit" class="btn btn-primary" id="buttonSearch">Поиск</button></div></div>';
    divSelectList.innerHTML = selectInput;

    let buttonSearch = document.getElementById('buttonSearch');
    buttonSearch.onclick = __WEBPACK_IMPORTED_MODULE_0__submitQuery__["a" /* default */];
}

/***/ }),

/***/ 160:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Изменение статуса выполняемой задачи
 * 
 * Версия 0.11, дата релиза 20.02.2018
 */



/* harmony default export */ __webpack_exports__["a"] = (function (data) {
    function addButtonImport() {
        let taskInformation = divTaskIndex.querySelector('input[type="hidden"]').dataset.taskinformation;

        if (~taskInformation.indexOf(':')) {
            let tmpInformation = taskInformation.split(':');
            let dataAccessRights = tmpInformation[0];
            let countFilesUploaded = tmpInformation[1];

            if (countFilesUploaded > 0) {
                let buttonTrash = divTaskIndex.querySelector('.glyphicon-trash').parentElement;

                if (buttonTrash === null) return;

                let elemSpan = document.createElement('span');
                elemSpan.setAttribute('class', 'glyphicon glyphicon-import');

                let elemButton = document.createElement('button');
                elemButton.setAttribute('type', 'button');
                elemButton.setAttribute('class', 'btn btn-default btn-sm btn-file');
                elemButton.setAttribute('title', 'загрузить сетевой трафик');
                elemButton.setAttribute('style', 'margin-right: 4px;');

                if (dataAccessRights === false) elemButton.setAttribute('disabled', 'disabled');

                elemButton.appendChild(elemSpan);
                elemButton.appendChild(document.createTextNode(' импорт'));

                buttonTrash.parentElement.insertBefore(elemButton, buttonTrash);
                elemButton.addEventListener('click', function (taskIndex) {
                    socket.emit('get list all files obtained result filtering', { processingType: 'importFiles', taskIndex: taskIndex });
                }.bind(null, data.informationPageJobLog.idElement));
            }
        }
    }

    let divTaskIndex = document.getElementById('task_' + data.informationPageJobLog.idElement);

    if (divTaskIndex === null) return;

    let objJobStatus = {
        'start': ['выполняется', '#00acee'],
        'expect': ['oжидает', '#ffcc2f'],
        'rejected': ['oтклонена', '#ffcc2f'],
        'execute': ['выполняется', '#00acee'],
        'complete': ['завершена', '#2baf2b'],
        'stop': ['остановлена', '#ef5734']
    };

    let objLoadingStatus = {
        'not loaded': ['не выполнялся', '#989898'],
        'partially loaded': ['загружены частично', '#989898'],
        'in line': ['в очереди', '#ffcc2f'],
        'loaded': ['выполняется', '#00acee'],
        'suspended': ['приостановлен', '#ef5734'],
        'expect': ['ожидает', '#ffcc2f'],
        'uploaded': ['выполнен', '#2baf2b']
    };

    if (data.informationPageJobLog.typeElement === 'uploadFiles') {
        divTaskIndex.children[5].innerHTML = objLoadingStatus[data.informationPageJobLog.newStatus][0];
        divTaskIndex.children[5].style.color = objLoadingStatus[data.informationPageJobLog.newStatus][1];

        let isExpect = data.informationPageJobLog.newStatus === 'expect';
        let isUploaded = data.informationPageJobLog.newStatus === 'uploaded';
        let isLoaded = data.informationPageJobLog.newStatus === 'loaded';

        //удаление кнопки 'импорт'
        if (isExpect || isUploaded || isLoaded) {
            let buttonImport = divTaskIndex.querySelector('.glyphicon-import');

            if (buttonImport === null) return;

            let parentElement = buttonImport.parentElement.parentElement;
            parentElement.removeChild(buttonImport.parentElement);
        }

        //добавление кнопки 'импорт'
        if (data.informationPageJobLog.newStatus === 'partially loaded') {
            addButtonImport();
        }
    } else if (data.informationPageJobLog.typeElement === 'jobStatus') {

        divTaskIndex.children[6].innerHTML = objJobStatus[data.informationPageJobLog.newStatus][0];
        divTaskIndex.children[6].style.color = objJobStatus[data.informationPageJobLog.newStatus][1];

        //добавление кнопки 'импорт'
        if (data.informationPageJobLog.newStatus === 'complete') {
            addButtonImport();
        }
    }
});

/***/ }),

/***/ 161:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__parametersRequestDownloadFiles__ = __webpack_require__(98);
/**
 * Модуль обрабатывающий запрос на выгрузку всех найденных в результате фильтрации файлов
 * 
 * Версия 0.1, дата релиза 02.06.2018
 */





/* harmony default export */ __webpack_exports__["a"] = (function (socket) {
  let parametersRequestDownloadFiles = new __WEBPACK_IMPORTED_MODULE_0__parametersRequestDownloadFiles__["a" /* default */]('modalLabelListDownloadFiles');
  let objData = parametersRequestDownloadFiles.getObjectData(['taskIndex', 'sourceId']);

  socket.emit('download all files obtained result filtering', objData);

  $('#modalListDownloadFiles').modal('hide');
});;

/***/ }),

/***/ 162:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__parametersRequestDownloadFiles__ = __webpack_require__(98);
/**
 * Модуль формирующий запрос на загрузку всех выбранных пользователем файлов
 * 
 * Версия 0.1, дата релиза 02.06.2018
 */





/* harmony default export */ __webpack_exports__["a"] = (function (socket) {
    let parametersRequestDownloadFiles = new __WEBPACK_IMPORTED_MODULE_0__parametersRequestDownloadFiles__["a" /* default */]('modalLabelListDownloadFiles');
    let objData = parametersRequestDownloadFiles.getObjectData(['taskIndex', 'sourceId']);

    let checkBox = document.getElementsByName('checkbox_setFileDownload');

    let fileIsChecked = [];
    for (let i = 0; i < checkBox.length; i++) {
        if (!checkBox[i].checked) continue;
        if (checkBox[i].dataset === null || checkBox[i].dataset.fileName === null) continue;

        fileIsChecked.push(checkBox[i].dataset.fileName);
    }

    if (fileIsChecked.length === 0) return;

    objData.listFiles = fileIsChecked;

    socket.emit('download choose files obtained result filtering', objData);

    $('#modalListDownloadFiles').modal('hide');
});

/***/ }),

/***/ 163:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createModalWindow;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__ = __webpack_require__(4);
/**
 * Создание модального окна содержащего информацию по найденным, в результате
 * фильтрации, файлам 
 * 
 * Версия 0.1, дата релиза 28.06.2018
 */





function createModalWindow(objData) {
    if (objData.information.length === 0) return;

    let objFileDownload = {
        'true': ['загружен', '#2baf2b'],
        'false': ['не выгружался', '#ef5734']
    };

    let modalTitle = document.querySelector('#modalLabelListDownloadFiles .modal-title');

    modalTitle.dataset.number_message_parts = objData.numberMessageParts;

    modalTitle.innerHTML = `Источник №${objData.sourceId} (${objData.shortName}), ${objData.detailedDescription}`;
    modalTitle.style.textAlign = 'center';

    document.getElementById('field_table').innerHTML = createTable(objData.information, objFileDownload);

    let elementModalLabelListDownloadFiles = document.getElementById('modalLabelListDownloadFiles');
    elementModalLabelListDownloadFiles.dataset.taskIndex = objData.taskIndex;
    elementModalLabelListDownloadFiles.dataset.sourceId = objData.sourceId;

    //обработчик на кнопки сортировки
    (function () {
        let elementsByName = document.getElementsByName('sortColumns');
        elementsByName.forEach(function (item) {
            item.addEventListener('click', sortColumns);
        });
    })();

    //обработчик на обновление списка найденных в результате фильтрации файлов
    (function () {
        if (document.getElementById('modalListDownloadFiles').hasAttribute('funcScroll')) return;

        socket.on('next list chunk files filter result', function (data) {
            let mlldf = document.getElementById('modalLabelListDownloadFiles');
            let taskIndex = mlldf.dataset.taskIndex;

            if (taskIndex !== data.taskIndex) return;

            let modalTitle = document.querySelector('#modalLabelListDownloadFiles .modal-title');
            modalTitle.dataset.number_message_parts = data.nextChunk;

            let tbody = document.querySelector('.table tbody');

            let serialNumber = tbody.children.length;
            let sn = Number(serialNumber);

            for (let fn in data.listFileInformation) {
                let fd,
                    isChecked = '';
                if (data.listFileInformation[fn].fileDownloaded) {
                    fd = objFileDownload['true'];
                } else {
                    fd = objFileDownload['false'];
                    isChecked = `<input type="checkbox" name="checkbox_setFileDownload" data-file-name="${fn}">`;
                }

                let tr = document.createElement('tr');
                tr.setAttribute('data-toggle', 'tooltip');

                if (!isNaN(sn)) sn++;

                let table = `<td class="text-center" style="padding-top: 15px;">${sn}</td>
                    <td class="text-left" style="padding-top: 15px;">${fn}</td>
                    <td class="text-right" style="padding-top: 15px;" 
                    data-file-size="${data.listFileInformation[fn].fileSize}">
                    ${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].intConvert(data.listFileInformation[fn].fileSize)}</td>
                    <td class="text-left" style="padding-top: 15px;"><span style="color: ${fd[1]}">${fd[0]}</span></td>
                    <td class="text-right">${isChecked}</td>`;

                tr.innerHTML = table;
                tbody.appendChild(tr);
            }
        });
    })();

    //обработчик на скролинк, для автоматической подгрузки списка файлов
    (function () {
        sendRequestNextListFiles();
    })();

    $('#modalListDownloadFiles').modal('show');
}

function sendRequestNextListFiles() {
    function checkViewport(id) {
        let myElement = document.getElementById(id),
            landmark = myElement.getBoundingClientRect(),
            visibility = landmark.top + myElement.scrollHeight > 0 && landmark.left + myElement.scrollWidth > 0 && landmark.bottom - myElement.scrollHeight < document.documentElement.clientHeight && landmark.right - myElement.scrollWidth < document.documentElement.clientWidth;

        return visibility;
    }

    let mldfElement = document.getElementById('modalListDownloadFiles');

    if (mldfElement.hasAttribute('funcScroll')) return;

    mldfElement.setAttribute('funcScroll', '');
    mldfElement.addEventListener('scroll', function (e) {
        if (checkViewport('tableFinish')) {
            let mlldf = document.getElementById('modalLabelListDownloadFiles');
            let taskIndex = mlldf.dataset.taskIndex;
            let sourceID = mlldf.dataset.sourceId;

            let modalLabel = document.querySelector('#modalLabelListDownloadFiles .modal-title');
            if (modalLabel.dataset.number_message_parts === null) return;
            let nextChunk = modalLabel.dataset.number_message_parts;

            let arrayNumberMessageParts = nextChunk.split(',');
            if (arrayNumberMessageParts.length === 3) {
                if (arrayNumberMessageParts[0] === arrayNumberMessageParts[1]) return;
            }

            socket.emit('next chunk files filter result', {
                processingType: 'importFiles',
                taskIndex: taskIndex,
                sourceID: sourceID,
                nextChunk: nextChunk
            });
        }
    });
}

function createTable(data, objFileDownload) {
    let table = `<div class="table-responsive" style="margin-left: 10px; margin-right: 10px;">
        <table class="table table-striped table-hover table-sm">
            <thead>
                <tr>
                <th class="text-center">№&nbsp;</th>
                <th class="text-left">имя файла&nbsp;<span class="glyphicon glyphicon-triangle-bottom" name="sortColumns" style="cursor: pointer" data-element-order="1"></span></th>
                <th class="text-right">размер (в байтах)&nbsp;<span class="glyphicon glyphicon-triangle-bottom" name="sortColumns" style="cursor: pointer" data-element-order="2"></span></th>
                <th class="text-left">фаил загружен&nbsp;<span class="glyphicon glyphicon-triangle-bottom" name="sortColumns" style="cursor: pointer" data-element-order="3"></span></th>
                <th></th>
                </tr>
            </thead>
            <tbody>`;

    let serialNumber = 0;
    for (let fn in data) {
        let fd,
            isChecked = '';
        if (data[fn].fileDownloaded) {
            fd = objFileDownload['true'];
        } else {
            fd = objFileDownload['false'];
            isChecked = `<input type="checkbox" name="checkbox_setFileDownload" data-file-name="${fn}">`;
        }

        table += `<tr data-toggle="tooltip">
            <td class="text-center" style="padding-top: 15px;">${++serialNumber}</td>
            <td class="text-left" style="padding-top: 15px;">${fn}</td>
            <td class="text-right" style="padding-top: 15px;" data-file-size="${data[fn].fileSize}">${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].intConvert(data[fn].fileSize)}</td>
            <td class="text-left" style="padding-top: 15px;"><span style="color: ${fd[1]}">${fd[0]}</span></td>
            <td class="text-right">${isChecked}</td>
            </tr>`;
    }

    table += `</tbody>
        </table>
        <div id="tableFinish"></div>
        </div>`;

    return table;
}

function sortColumns(event) {
    //изменяем иконку
    let sortOrder = changeIcon();
    let numberElement = event.target.dataset.elementOrder;

    let tableBody = document.getElementById('field_table').firstElementChild.firstElementChild.children[1];
    let trElements = tableBody.querySelectorAll('tr');

    let newTableBody = '';
    let arraySort = [];
    trElements.forEach(function (item) {
        let valueID = item.children[+numberElement].innerText;

        if (+numberElement === 0) {
            valueID = Number(item.children[+numberElement].innerText);
        } else if (+numberElement === 2) {
            valueID = Number(item.children[+numberElement].dataset.fileSize);
        }

        item.children[0].innerText = "$$";

        arraySort.push({
            id: valueID,
            value: item.outerHTML
        });
    });

    arraySort.sort(compare);
    if (!sortOrder) arraySort.reverse();

    let num = 1;
    //формируем новое тело таблицы
    arraySort.forEach(function (item) {
        item.value = item.value.replace('$$', num++);
        newTableBody += item.value.toString();
    });

    tableBody.innerHTML = newTableBody;

    $('[data-toggle="tooltip"]').tooltip();

    function changeIcon() {
        let elementSpan = event.target;
        let sortIn = elementSpan.classList.contains('glyphicon-triangle-bottom');

        if (sortIn) {
            elementSpan.classList.remove('glyphicon-triangle-bottom');
            elementSpan.classList.add('glyphicon-triangle-top');
        } else {
            elementSpan.classList.remove('glyphicon-triangle-top');
            elementSpan.classList.add('glyphicon-triangle-bottom');
        }
        return sortIn;
    }

    function compare(a, b) {
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
    }
}

/***/ }),

/***/ 19:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 * Модуль для создания модального окна вывода информации по выбранному заданию фильтрациии
 *
 * Версия 1.0, релиз 10.11.2017
 * */



/* harmony default export */ __webpack_exports__["a"] = ({
    //генерируем запрос всей информации по задаче (ДЛЯ ГЛАВНОЙ СТРАНИЦЫ)
    getAllInformationForTaskFilterIndexPage(event) {
        if (event.target.tagName !== 'DIV') return;

        let divLeftContent = document.getElementById('leftContent');
        let target = event.target;

        while (target !== divLeftContent) {
            if (target.dataset.hasOwnProperty('taskIndex')) {
                let taskIndex = target.dataset.taskIndex;

                //генерируем событие (запрос всей информации)
                socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
                return;
            }
            target = target.parentNode;
        }
    },

    //генерируем запрос всей информации по задаче (ДЛЯ СТРАНИЦЫ УЧЕТА ЗАДАНИЙ НА ФИЛЬТРАЦИЮ)
    getAllInformationForTaskFilterJobLogPage(taskIndex) {
        socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
    },

    //запрос на останов задачи фильтрации
    stopFilterTask(taskIndex) {
        socket.emit('request to stop the task filter', { processingType: 'stopTaskFilter', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на возобновление выполнения задачи по фильтрации
    resumeFilterTask(taskIndex, objectTimers) {
        socket.emit('request to resume the task filter', { processingType: 'resumeTaskFilter', taskIndex: taskIndex });

        if (objectTimers && taskIndex in objectTimers) {
            clearTimeout(objectTimers[taskIndex]);
            delete objectTimers[taskIndex];
        }

        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на останов загрузки файлов
    stopDownloadFiles(taskIndex) {
        socket.emit('stop download files', { processingType: 'taskDownload', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на возобновление загрузки файлов
    resumeDownloadFiles(taskIndex) {
        socket.emit('resume download files', { processingType: 'taskDownload', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на отмену задачи по загрузки файлов
    cancelDownloadFiles(taskIndex) {
        socket.emit('cancel download files', { processingType: 'taskDownload', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    }
});

/***/ }),

/***/ 2:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return showNotify; });
/**
 * Общий вид сообщений
 * 
 * Версия 0.1, дата релиза 23.11.2017
 */



let showNotify = function (type, message) {
    $.notify({
        message: message
    }, {
        type: type,
        placement: { from: 'top', align: 'right' },
        offset: { x: 0, y: 60 }
    });
};



/***/ }),

/***/ 28:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createModalWindowFilterResults;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__ = __webpack_require__(19);
/**
 * Формирование модального окна с результатами фильтрации
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */






function createModalWindowFilterResults(obj, objectTimers) {
    let objInformation = obj.information;

    //формируем модальное окно
    creatingNewModalWindow();

    //добавляем данные в модальное окно
    setDataModalWindowFilterResults(objInformation);

    $('#modalWindowTaskFilter').modal('show');

    //добавляем обработчик на кнопку 'остановить' для ОСТАНОВКИ ФИЛЬТРАЦИИ
    let buttonSubmitFilterStop = document.querySelector('.btn-danger[data-filter="filterStop"]');
    if (buttonSubmitFilterStop !== null) buttonSubmitFilterStop.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].stopFilterTask.bind(null, objInformation.taskIndex));

    //добавляем обработчик на кнопку 'возобновить' для ВОЗОБНАВЛЕНИЯ ФИЛЬТРАЦИИ
    let buttonSubmitFilterResume = document.querySelector('.btn-danger[data-filter="filterResume"]');
    if (buttonSubmitFilterResume !== null) buttonSubmitFilterResume.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].resumeFilterTask.bind(null, objInformation.taskIndex, objectTimers));

    //добавляем обработчик на кнопку 'остановить' для ОСТАНОВКИ ЗАГРУЗКИ ФАЙЛОВ
    let buttonSubmitDownloadStop = document.querySelector('.btn-danger[data-download="loaded"]');
    if (buttonSubmitDownloadStop !== null) buttonSubmitDownloadStop.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].stopDownloadFiles.bind(null, objInformation.taskIndex));
    //добавляем обработчик на кнопку 'возобновить' для ВОЗОБНАВЛЕНИЯ ЗАГРУЗКИ ФАЙЛОВ
    let buttonSubmitDownloadResume = document.querySelector('.btn-danger[data-download="suspended"]');
    if (buttonSubmitDownloadResume !== null) buttonSubmitDownloadResume.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].resumeDownloadFiles.bind(null, objInformation.taskIndex));
    //добавляем обработчик на кнопку 'отменить' для ОТМЕНЫ ЗАДАЧИ ПО ВЫГРУЗКЕ ФАЙЛОВ
    let buttonSubmitDpwnloadCancel = document.querySelector('.btn-danger[data-download="in line"]');
    if (buttonSubmitDpwnloadCancel !== null) buttonSubmitDpwnloadCancel.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].cancelDownloadFiles.bind(null, objInformation.taskIndex));

    //формирование модального окна
    function creatingNewModalWindow() {
        /* удаляем модальное окно */
        let oldModalWindow = document.getElementById('modalWindowTaskFilter');
        if (oldModalWindow !== null) {
            oldModalWindow.innerHTML = '';
            document.body.removeChild(oldModalWindow);
        }
        /* заголовок модального окна */
        let divHeader = document.createElement('div');
        divHeader.classList.add('modal-header');

        let button = document.createElement('button');
        button.classList.add('close');
        button.setAttribute('data-dismiss', 'modal');
        button.setAttribute('aria-hidden', 'true');
        button.appendChild(document.createTextNode('x'));

        let h4 = document.createElement('h4');
        h4.classList.add('modal-title');

        divHeader.appendChild(button);
        divHeader.appendChild(h4);

        /* основное содержимое модального окна */
        let divBody = document.createElement('div');
        divBody.style.display = 'inline-block';
        divBody.classList.add('modal-body');

        /* основное модальное окно */
        let divModalWindow = document.createElement('div');
        divModalWindow.classList.add('modal');
        divModalWindow.classList.add('fade');
        divModalWindow.setAttribute('id', 'modalWindowTaskFilter');
        divModalWindow.setAttribute('tabindex', '-1');
        divModalWindow.setAttribute('role', 'dialog');

        let divModal = document.createElement('div');
        divModal.classList.add('modal-dialog');
        divModal.classList.add('modal-lg');

        let divContent = document.createElement('div');
        divContent.classList.add('modal-content');
        divContent.style.minHeight = '600px';

        divContent.appendChild(divHeader);
        divContent.appendChild(divBody);
        divModal.appendChild(divContent);
        divModalWindow.appendChild(divModal);

        document.body.appendChild(divModalWindow);
    }

    //заполняем модальное окно данными
    function setDataModalWindowFilterResults(obj) {

        setModalHeader(obj);
        setModalBody(obj);

        function getDateTime(dateTimeUnix) {
            let x = new Date().getTimezoneOffset() * 60000;
            let dateTimeString = new Date(+dateTimeUnix - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
            let dateTimeArr = dateTimeString.split(' ');
            let dateArr = dateTimeArr[0].split('-');
            return dateTimeArr[1] + ' ' + dateArr[2] + '.' + dateArr[1] + '.' + dateArr[0];
        }

        function setModalHeader(obj) {
            let headderElement = document.querySelector('#modalWindowTaskFilter .modal-title');
            headderElement.innerHTML = 'Источник №' + obj.sourceId + ' (' + obj.shortName + '), задание добавлено в ' + getDateTime(obj.dateTimeAddTaskFilter);
        }

        function setModalBody(obj) {
            let bodyElement = document.querySelector('#modalWindowTaskFilter .modal-body');
            if (obj.dateTimeStartFilter === 'null') {
                modalBodyRedject(obj);
            } else {
                modalBodyAllInformationFiltering(obj);
            }

            //вывод когда задача отклонена
            function modalBodyRedject(obj) {
                let taskFilterSettings = JSON.parse(obj.filterSettings);
                let ipaddress = taskFilterSettings.ipaddress + '';
                let listIpaddress = ipaddress === 'null' ? '' : ipaddress.replace(new RegExp(',', 'g'), '<br>');
                let network = taskFilterSettings.network + '';
                let listNetwork = network === 'null' ? '' : network.replace(new RegExp(',', 'g'), '<br>');
                let dateTimeStart = taskFilterSettings.dateTimeStart.split(' ');
                let dateTimeEnd = taskFilterSettings.dateTimeEnd.split(' ');

                //полное название источника
                let stringNameSource = `<div class="col-sm-12 col-md-12 col-lg-12 text-center"><h4><strong>${obj.detailedDescription}</strong></h4></div>`;

                //имя пользователя, время начала фильтрации и ее окончание
                let stringUserNameTimeStartAndEnd = `<div class="col-sm-4 col-md-4 col-lg-4 text-center">пользователь: <br>${obj.userName}</div>`;
                stringUserNameTimeStartAndEnd += '<div class="col-sm-4 col-md-4 col-lg-4 text-center">начало фильтрации: <br><strong>отклонена</strong></div>';
                stringUserNameTimeStartAndEnd += '<div class="col-sm-4 col-md-4 col-lg-4 text-center">окончание фильтрации: <br><strong>нет</strong></div>';

                //параметры фильтрации
                let stringFilterSettings = '<div class="col-sm-6 col-md-6 col-lg-6 text-center" style="margin-top: 15px; padding-top: 5px; padding-bottom: 5px; border-radius: 15px 0 15px 0; border: 1px solid #d9d9d9;">параметры фильтрации</br>';
                stringFilterSettings += '<div class="col-sm-12 col-md-12 col-lg-12">';
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>начальное время</strong><br>${dateTimeStart[1]} ${dateTimeStart[0]}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>конечное время</strong><br>${dateTimeEnd[1]} ${dateTimeEnd[0]}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>ip-адреса</strong><br>${listIpaddress}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>сети</strong><br>${listNetwork}</div>`;
                stringFilterSettings += '</div></div><div class="col-lg-6 text-center"></div>';

                bodyElement.innerHTML = '<div class="col-sm-12 col-md-12 col-lg-12">' + stringNameSource + stringUserNameTimeStartAndEnd + stringFilterSettings + '</div>';
            }

            //вывод информации по фильтрации, выполнется когда выполняются все действия кроме 'задача отклонена'
            function modalBodyAllInformationFiltering(obj) {
                let dateTimeEndFilter = '';
                let dateTimeStartFilter = getDateTime(obj.dateTimeStartFilter);

                if (obj.dateTimeEndFilter === 'null') {
                    dateTimeEndFilter = '<strong>выполняется</strong>';
                } else {
                    dateTimeEndFilter = getDateTime(obj.dateTimeEndFilter);
                }

                let objJobStatus = {
                    'start': 'выполняется',
                    'execute': 'выполняется',
                    'complete': 'завершена',
                    'stop': 'остановлена'
                };

                let taskFilterSettings = JSON.parse(obj.filterSettings);

                let ipaddress = taskFilterSettings.ipaddress + '';
                let listIpaddress = ipaddress === 'null' ? '' : ipaddress.replace(new RegExp(',', 'g'), '<br>');
                let network = taskFilterSettings.network + '';
                let listNetwork = network === 'null' ? '' : network.replace(new RegExp(',', 'g'), '<br>');
                let dateTimeStart = taskFilterSettings.dateTimeStart.split(' ');
                let dateTimeEnd = taskFilterSettings.dateTimeEnd.split(' ');
                let percent = Math.ceil(+obj.countFilesProcessed * 100 / +obj.countFilesFiltering);

                //полное название источника
                let stringNameSource = `<div class="col-sm-12 col-md-12 col-lg-12 text-center"><h4><strong>${obj.detailedDescription}</strong></h4></div>`;

                //имя пользователя, время начала фильтрации и ее окончание
                let stringUserNameTimeStartAndEnd = `<div class="col-sm-4 col-md-4 col-lg-4 text-center">пользователь: <br>${obj.userName}</div>`;
                stringUserNameTimeStartAndEnd += `<div class="col-sm-4 col-md-4 col-lg-4 text-center">начало фильтрации: <br>${dateTimeStartFilter}</div>`;
                stringUserNameTimeStartAndEnd += `<div class="col-sm-4 col-md-4 col-lg-4 text-center">окончание фильтрации: <br>${dateTimeEndFilter}</div>`;

                //параметры фильтрации
                let stringFilterSettings = '<div class="col-sm-6 col-md-6 col-lg-6 text-center" style="margin-top: 15px; padding-top: 5px; padding-bottom: 5px; border-radius: 15px 0 15px 0; border: 1px solid #d9d9d9;">параметры фильтрации</br>';
                stringFilterSettings += '<div class="col-sm-12 col-md-12 col-lg-12">';
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>начальное время</strong><br>${dateTimeStart[1]} ${dateTimeStart[0]}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>конечное время</strong><br>${dateTimeEnd[1]} ${dateTimeEnd[0]}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>ip-адреса</strong><br>${listIpaddress}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>сети</strong><br>${listNetwork}</div>`;
                stringFilterSettings += '</div></div>';

                let stringProgressBar = `<div class="col-sm-2 col-md-2 col-lg-2 text-center" style="margin-top: 15px;"><div class="progress-pie-chart" data-percent="${percent}">`;
                stringProgressBar += `<div class="c100 p${percent}"><span>${percent}%</span><div class="slice"><div class="bar"></div><div class="fill"></div></div></div></div></div>`;

                let countMaxFilesSize = __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].changeByteSize(obj.countMaxFilesSize);
                let countFoundFilesSize = __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].changeByteSize(obj.countFoundFilesSize);

                let stringFileInformation = '<div class="col-sm-4 col-md-4 col-lg-4" class="text-left" style="margin-top: 10px;">';
                stringFileInformation += `<div style="margin-left: 20px">статус: <strong>фильтрация ${objJobStatus[obj.jobStatus]}</strong></div>`;
                stringFileInformation += `<div style="margin-left: 20px">всего файлов: <strong>${obj.countFilesFiltering}</strong> шт.</div>`;
                stringFileInformation += `<div style="margin-left: 20px">общим размером: ${countMaxFilesSize}</div>`;
                stringFileInformation += `<div style="margin-left: 20px">файлов обработанно: <strong>${obj.countFilesProcessed}</strong> шт.</div>`;
                stringFileInformation += `<div style="margin-left: 20px">файлов найдено: <strong>${obj.countFilesFound}</strong> шт.</div>`;
                stringFileInformation += `<div style="margin-left: 20px">общим размером: ${countFoundFilesSize}</div>`;
                stringFileInformation += `<div style="margin-left: 20px">фильтруемых директорий: <strong>${obj.countDirectoryFiltering}</strong></div></div>`;

                let stringTargetDirectory = `<div class="col-sm-12 col-md-12 col-lg-12 text-center" style="margin-top: 15px">директория для хранения найденных файлов на источнике<br><strong>${obj.directoryFiltering}</strong></div>`;

                let disabledButton = obj.userIsFilter === false ? 'disabled="disabled"' : '';
                let buttonFilterAction = '';
                if (obj.jobStatus === 'execute') {
                    buttonFilterAction = `<button type="submit" data-filter="filterStop" class="btn btn-danger" ${disabledButton}>Остановить</button>`;
                } else if (obj.jobStatus === 'stop') {
                    buttonFilterAction = `<button type="submit" data-filter="filterResume" class="btn btn-danger" ${disabledButton}>Возобновить</button>`;
                }

                let button = `<div class="col-sm-12 col-md-12 col-lg-12 text-right" style="margin-top: 10px;">${buttonFilterAction}</div>`;

                bodyElement.innerHTML = '<div class="col-sm-12 col-md-12 col-lg-12">' + stringNameSource + stringUserNameTimeStartAndEnd + stringFilterSettings + stringProgressBar + stringFileInformation + stringTargetDirectory + modalBodyInformationDownloadFiles() + button + '</div>';
            }

            //вывод информации по выгрузке файлов
            function modalBodyInformationDownloadFiles() {
                let objLoadingStatus = {
                    'not loaded': 'не выполнялся',
                    'in line': 'в очереди',
                    'loaded': 'выполняется',
                    'suspended': 'приостановлен',
                    'partially loaded': 'загружены частично',
                    'expect': 'ожидает',
                    'uploaded': 'выполнен'
                };

                //имя пользователя, время начала фильтрации и ее окончание
                let uploadFiles = obj.uploadFiles === 'null' ? '' : `импорт файлов: <strong>${objLoadingStatus[obj.uploadFiles]}</strong>`;
                let stringUploadFiles = `<div class="col-sm-5 col-md-5 col-lg-5 text-left" style="padding-left: 40px;">${uploadFiles}</div>`;
                let userName = obj.userNameStartUploadFiles === 'null' ? '' : 'пользователь: ' + obj.userNameStartUploadFiles;
                if (obj.userNameStopUploadFiles !== 'null') userName = 'пользователь: ' + obj.userNameStartUploadFiles;

                let stringUserNameStartDownload = `<div class="col-sm-7 col-md-7 col-lg-7 text-center">${userName}</div>`;

                //дополнительная информация, имена пользователей остановивших и возобновивших загрузку, процент выполнения загрузки
                let majorInformation = '',
                    stringMajorInformation = '',
                    stringProgressBar = '',
                    stringLookedThisTask = '';

                if (obj.dateTimeStartUploadFiles !== 'null') {
                    let percent = Math.ceil(+obj.countFilesLoaded * 100 / +obj.countFilesFound);

                    let dateTimeEndUploadFiles = obj.dateTimeEndUploadFiles === 'null' ? '' : getDateTime(obj.dateTimeEndUploadFiles);
                    let dateTimeStopUploadFiles = obj.dateTimeStopUploadFiles === 'null' ? '' : getDateTime(obj.dateTimeStopUploadFiles);

                    majorInformation += `<div style="margin-top: 10px;">начало: ${getDateTime(obj.dateTimeStartUploadFiles)}</div>`;
                    majorInformation += `<div>окончание: ${dateTimeEndUploadFiles}</div>`;
                    majorInformation += `<div>отмена: ${dateTimeStopUploadFiles}</div>`;
                    majorInformation += `<div style="margin-top: 10px;">всего файлов: ${obj.countFilesFound}</div>`;
                    majorInformation += `<div>файлов загружено: ${obj.countFilesLoaded}</div>`;
                    majorInformation += `<div>файлов загружено с ошибкой: ${obj.countFilesLoadedError}</div>`;

                    let progressBar = `<div class="progress-pie-chart" data-percent="${percent}"><div class="c100 my_settings p${percent}"><span>${percent}%</span><div class="slice"><div class="bar"></div><div class="fill"></div></div></div></div>`;

                    //дополнительная информация
                    stringMajorInformation += `<div class="col-sm-4 col-md-4 col-lg-4 text-left" style="margin-top: 5px;">${majorInformation}</div>`;
                    //индикатор прогресса
                    stringProgressBar += `<div class="col-sm-3 col-md-3 col-lg-3 text-left" style="margin-top: 5px;">${progressBar}</div>`;

                    if (obj.dateTimeLookedThisTask !== 'null') {
                        let informationLooked = `<div style="margin-top: 10px;">файлы рассмотрены в ${getDateTime(obj.dateTimeLookedThisTask)}</div>`;
                        informationLooked += `<div>пользователь:<br>${obj.userNameLookedThisTask}</div>`;
                        //информация о пользователе и времени рассмотрения задачи
                        stringLookedThisTask += `<div class="col-sm-5 col-md-5 col-lg-5 text-left" style="margin-top: 5px;">${informationLooked}</div>`;
                    }
                }

                let stringInformation = stringMajorInformation + stringProgressBar + stringLookedThisTask;

                //директория для скачивания файлов
                let uploadDirectoryFiles = obj.uploadDirectoryFiles === 'null' ? '' : `<div class="col-sm-12 col-md-12 col-lg-12 text-center" style="margin-top: 15px">директория для хранения загруженных файлов<br><strong>${obj.uploadDirectoryFiles}</strong></div>`;

                let disabledButtonStop,
                    buttonExecute = '';
                if (obj.uploadFiles === 'loaded') {
                    disabledButtonStop = obj.userIsImport === true && obj.taskImportStop === true ? '' : 'disabled="disabled"';

                    buttonExecute = `<button type="submit" data-download="loaded" class="btn btn-danger" ${disabledButtonStop}>Остановить</button>`;
                }
                /*else if (obj.uploadFiles === 'suspended') {
                                   disabledButtonStop = ((obj.userIsImport === true) && (obj.taskImportResume === true)) ? '' : 'disabled="disabled"';
                                    buttonExecute = `<button type="submit" data-download="suspended" class="btn btn-danger" ${disabledButtonStop}>Возобновить</button>`;
                               }*/
                else if (obj.uploadFiles === 'in line') {
                        disabledButtonStop = obj.userIsImport === true && obj.taskImportCancel === true ? '' : 'disabled="disabled"';

                        buttonExecute = `<button type="submit" data-download="in line" class="btn btn-danger" ${disabledButtonStop}>Отменить</button>`;
                    }

                let button = '<div class="col-sm-12 col-md-12 col-lg-12 text-right" style="margin-top: 10px;">' + buttonExecute + '</div>';

                return '<div class="col-sm-12 col-md-12 col-lg-12" style="margin-top: 15px">' + stringUploadFiles + stringUserNameStartDownload + stringInformation + uploadDirectoryFiles + button + '</div>';
            }
        }
    }
}

/***/ }),

/***/ 31:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Открытие модального окна подтверждения удаления задачи фильтрации
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */



/* harmony default export */ __webpack_exports__["a"] = (function (taskIndex) {
  document.querySelector('#modalLabelDelete .modal-title').innerHTML = 'Удаление';
  let modalBody = document.querySelector('#modalDelete .modal-body');

  modalBody.innerHTML = `<p data-task-index="${taskIndex}">Удалить всю информацию о задаче?</p>`;

  $('#modalDelete').modal('show');
});

/***/ }),

/***/ 32:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createTableTaskResultFilter;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__openModalWindowDelete__ = __webpack_require__(31);
/**
 * Создание новой таблицы содержащей результаты поиска
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */





function createTableTaskResultFilter(objData) {
    //удаление старой таблицы с данными
    function removeElementByClassName() {
        let removeElement = document.querySelector('#main-content .table');

        if (removeElement === null) return;

        let parentNode = removeElement.parentNode;
        parentNode.removeChild(removeElement);
    }

    //удаляем старую таблицу
    removeElementByClassName();

    function getName(userName) {
        if (!~userName.indexOf(' ')) return userName;

        let userNameTmp = userName.split(' ');
        let newUserName = '';
        for (let i = 0; i < userNameTmp.length; i++) {
            newUserName += i === 0 ? userNameTmp[i] + ' ' : userNameTmp[i][0] + '.';
        }
        return newUserName;
    }

    let informationTaskIndex = objData.informationTaskIndex;

    let number = 1;
    if (objData.informationPaginate.chunksNumber !== 1) {
        number = (objData.informationPaginate.chunksNumber - 1) * objData.informationPaginate.maxCountElementsIndex + 1;
    }

    let objJobStatus = {
        'start': ['выполняется', '#00acee'],
        'expect': ['oжидает', '#ffcc2f'],
        'rejected': ['oтклонена', '#ffcc2f'],
        'execute': ['выполняется', '#00acee'],
        'complete': ['завершена', '#2baf2b'],
        'stop': ['остановлена', '#ef5734']
    };

    let objLoadingStatus = {
        'not loaded': ['не выполнялся', '#989898'],
        'partially loaded': ['загружены частично', '#989898'],
        'in line': ['в очереди', '#ffcc2f'],
        'loaded': ['выполняется', '#00acee'],
        'suspended': ['приостановлен', '#ef5734'],
        'expect': ['ожидает', '#ffcc2f'],
        'uploaded': ['выполнен', '#2baf2b']
    };

    let inputDataAccessRights = document.getElementById('dataAccessRights').dataset.accessRights;
    let dataAccessRights = inputDataAccessRights.split(',');

    let disabledRead = dataAccessRights[0].split('=')[1] === 'false' ? 'disabled="disabled"' : '';
    let disabledImport = dataAccessRights[1].split('=')[1] === 'false' ? 'disabled="disabled"' : '';
    let disabledDelete = dataAccessRights[2].split('=')[1] === 'false' ? 'disabled="disabled"' : '';

    let divElement = document.getElementById('field_table');

    let tableHeader = '<thead><tr><th>№</th><th class="text-left">дата формирования задачи</th><th class="text-right">id источника</th><th class="text-left">пользователь</th>';
    tableHeader += '<th class="text-left">ip-адреса источники</th><th class="text-left">импорт файлов</th><th class="text-left">статус задачи</th><th class="text-right">файлов найдено</th></tr></thead>';

    let tableBody = '<tbody>';
    for (let taskIndex in informationTaskIndex) {
        let x = new Date().getTimezoneOffset() * 60000;
        let dateTimeAddTaskFilter = new Date(+informationTaskIndex[taskIndex].dateTimeAddTaskFilter - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');

        let textSettings, stringIpNetwork;
        try {
            let filterSettings = JSON.parse(informationTaskIndex[taskIndex].filterSettings);

            let dateTimeStart = filterSettings.dateTimeStart === null ? '' : filterSettings.dateTimeStart;
            let dateTimeEnd = filterSettings.dateTimeEnd === null ? '' : filterSettings.dateTimeEnd;

            textSettings = 'Временной интервал с ' + dateTimeStart + ' по ' + dateTimeEnd;
            textSettings += filterSettings.ipaddress === null ? '' : ', IP-адреса: ' + filterSettings.ipaddress.replace(/,/g, ', ');
            textSettings += filterSettings.network === null ? '' : ', диапазоны подсетей: ' + filterSettings.network;

            let arrayIpNetwork;
            if (filterSettings.ipaddress !== null && filterSettings.network !== null) {
                let arrayIp = filterSettings.ipaddress.split(',');
                let arrayNetwork = filterSettings.network.split(',');
                arrayIpNetwork = arrayIp.concat(arrayNetwork);
            } else if (filterSettings.ipaddress === null && filterSettings.network !== null) {
                arrayIpNetwork = filterSettings.network.split(',');
            } else if (filterSettings.ipaddress !== null && filterSettings.network === null) {
                arrayIpNetwork = filterSettings.ipaddress.split(',');
            } else {
                arrayIpNetwork = '';
            }

            if (typeof arrayIpNetwork === 'string') {
                stringIpNetwork = arrayIpNetwork;
            } else {
                arrayIpNetwork.sort();
                stringIpNetwork = arrayIpNetwork.join('<br>');
            }
        } catch (err) {
            textSettings = '';
        }
        let countFilesFound = +informationTaskIndex[taskIndex].countFilesFound === 0 ? informationTaskIndex[taskIndex].countFilesFound : `<strong>${informationTaskIndex[taskIndex].countFilesFound}</strong>`;

        let tableBodyButton = `<td class="text-right" data-task-index="${taskIndex}"><button type="button" name="buttonAllInformation" class="btn btn-default btn-sm" ${disabledRead} title="полная информация о задаче">`;
        tableBodyButton += '<span class="glyphicon glyphicon glyphicon-info-sign"></span></button>';

        let isJobStatusComplete = informationTaskIndex[taskIndex].jobStatus === 'complete';
        let isUploadFilesNotLoaded = informationTaskIndex[taskIndex].uploadFiles === 'not loaded' || informationTaskIndex[taskIndex].uploadFiles === 'partially loaded';
        let isGreaterZero = informationTaskIndex[taskIndex].countFilesFound > 0;

        if (isJobStatusComplete && isUploadFilesNotLoaded && isGreaterZero) {
            tableBodyButton += `<button type="button" name="buttonImport" class="btn btn-default btn-sm btn-file" ${disabledImport} title="загрузить сетевой трафик"><span class="glyphicon glyphicon-import"></span> импорт </button>`;
        }

        tableBodyButton += `<button type="button" name="buttonDelete" class="btn btn-default btn-sm" ${disabledDelete} title="удаление задачи">`;
        tableBodyButton += '<span class="glyphicon glyphicon-trash"></span></button><input type="hidden" data-taskInformation="' + dataAccessRights[1].split('=')[1] + ':' + informationTaskIndex[taskIndex].countFilesFound + '"></td>';

        tableBody += `<tr id="task_${taskIndex}" data-toggle="tooltip" title="${textSettings}"><td style="padding-top: 15px;">${number++}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px;">${dateTimeAddTaskFilter}</td>`;
        tableBody += `<td class="text-right" style="padding-top: 15px;">${informationTaskIndex[taskIndex].sourceId}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px;">${getName(informationTaskIndex[taskIndex].userName)}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px;">${stringIpNetwork}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px; color: ${objLoadingStatus[informationTaskIndex[taskIndex].uploadFiles][1]}">${objLoadingStatus[informationTaskIndex[taskIndex].uploadFiles][0]}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px; color: ${objJobStatus[informationTaskIndex[taskIndex].jobStatus][1]}">${objJobStatus[informationTaskIndex[taskIndex].jobStatus][0]}</td>`;
        tableBody += `<td class="text-right" style="padding-top: 15px;">${countFilesFound}</td>`;
        tableBody += tableBodyButton + '</tr>';
    }
    tableBody += '</tbody>';

    divElement.innerHTML = '<div class="table-responsive" style="margin-left: 10px; margin-right: 10px;"><table class="table table-striped table-hover table-sm">' + tableHeader + tableBody + '</table></div>';

    //загрузка отфильтрованного сетевого трафика
    function importFiles(taskIndex) {
        socket.emit('get list all files obtained result filtering', { processingType: 'importFiles', taskIndex: taskIndex });
    }

    (function () {
        //обработчик на кнопку 'импорт'
        (function () {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonImport"]');
            buttonsImport.forEach(element => {
                let taskIndex = element.parentElement.dataset.taskIndex;
                element.onclick = importFiles.bind(null, taskIndex);
            });
        })();

        //обработчик на кнопку 'удалить'
        (function () {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonDelete"]');
            buttonsImport.forEach(element => {
                let taskIndex = element.parentElement.dataset.taskIndex;
                element.onclick = __WEBPACK_IMPORTED_MODULE_0__openModalWindowDelete__["a" /* default */].bind(null, taskIndex);
            });
        })();

        //обработчик на кнопку 'полная информация'
        (function () {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonAllInformation"]');
            buttonsImport.forEach(element => {
                let taskIndex = element.parentElement.dataset.taskIndex;
                element.onclick = function (taskIndex) {
                    socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
                }.bind(null, taskIndex);
            });
        })();
    })();

    $('[data-toggle="tooltip"]').tooltip();
}

/***/ }),

/***/ 33:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createTableTaskUploadedFiles;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__commons_processPagination__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__openModalWindowDelete__ = __webpack_require__(34);
/**
 * Создание таблицы с информацией о задачах файлы по которым были загружены
 * 
 * Версия 0.1, дата релиза 28.11.2017
 */






function createTableTaskUploadedFiles(objData) {
    function getStringFileSize(integer) {
        let fileSize = integer + '';
        if (fileSize.length <= 3) {
            return fileSize + ' байт';
        } else if (fileSize.length > 3 && 6 >= fileSize.length) {
            return (fileSize / 1000).toFixed(2) + ' Кбайт';
        } else if (fileSize.length > 6 && 9 >= fileSize.length) {
            return (fileSize / 1000000).toFixed(2) + ' Мбайт';
        } else if (fileSize.length > 9 && 12 >= fileSize.length) {
            return (fileSize / 1000000000).toFixed(2) + ' Гбайт';
        } else {
            return fileSize;
        }
    }

    let disabledDelete;
    if (document.getElementById('dataAccessRights') !== null) {
        let deleteAccessRights = document.getElementById('dataAccessRights').dataset.accessRights;
        disabledDelete = deleteAccessRights === 'delete=false' ? 'disabled="disabled"' : '';
    }

    let informationTaskIndex = objData.informationTaskIndex;

    let number = objData.informationPaginate.chunksNumber !== 1 ? (objData.informationPaginate.chunksNumber - 1) * objData.informationPaginate.maxCountElementsIndex + 1 : 1;

    let divElement = document.getElementById('field_table');

    let tableHeader = '<thead><tr><th>№</th><th class="text-left">дата выгрузки файлов</th><th class="text-right">id источника</th><th class="text-left">название источника</th>';
    tableHeader += '<th class="text-right">файлов выгруженно</th><th class="text-right">объем файлов</th><th class="text-left">пользователь</th><th></th></tr></thead>';

    let tableBody = '<tbody>';
    let tableBodyButton = '';

    for (let taskIndex in informationTaskIndex) {
        let x = new Date().getTimezoneOffset() * 60000;
        let dateTimeStartUploadFiles = new Date(+informationTaskIndex[taskIndex].dateTimeStartUploadFiles - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');

        let textSettings;
        try {
            let filterSettings = JSON.parse(informationTaskIndex[taskIndex].filterSettings);

            let dateTimeStart = filterSettings.dateTimeStart === null ? '' : filterSettings.dateTimeStart;
            let dateTimeEnd = filterSettings.dateTimeEnd === null ? '' : filterSettings.dateTimeEnd;

            textSettings = `Временной интервал с ${dateTimeStart} по ${dateTimeEnd}`;
            textSettings += filterSettings.ipaddress === null ? '' : ', IP-адреса: ' + filterSettings.ipaddress.replace(/,/g, ', ');
            textSettings += filterSettings.network === null ? '' : ', диапазоны подсетей: ' + filterSettings.network;
        } catch (err) {
            textSettings = '';
        }
        tableBodyButton += `<tr id="task_${taskIndex}" data-toggle="tooltip" title="${textSettings}">`;
        tableBodyButton += `<td style="padding-top: 15px;">${number++}</td>`;
        tableBodyButton += `<td class="text-left" style="padding-top: 15px;">${dateTimeStartUploadFiles}</td>`;
        tableBodyButton += `<td class="text-right" style="padding-top: 15px;">${informationTaskIndex[taskIndex].sourceId}</td>`;
        tableBodyButton += `<td class="text-left" style="padding-top: 15px;">${informationTaskIndex[taskIndex].shortName}</td>`;
        tableBodyButton += `<td class="text-right" style="padding-top: 15px;">${informationTaskIndex[taskIndex].countFilesLoaded}</td>`;
        tableBodyButton += `<td class="text-right" style="padding-top: 15px;">${getStringFileSize(informationTaskIndex[taskIndex].countFoundFilesSize)}</td>`;
        tableBodyButton += `<td class="text-left" style="padding-top: 15px;">${informationTaskIndex[taskIndex].userNameStartUploadFiles}</td>`;
        tableBodyButton += '<td class="text-right">';
        tableBodyButton += '<button type="button" class="btn btn-default btn-sm" title="полная информация о выгруженных файлах"><span class="glyphicon glyphicon-info-sign"></span></button>';
        tableBodyButton += `<button type="button" class="btn btn-default btn-sm" ${disabledDelete} title="удаление"><span class="glyphicon glyphicon-trash"></span></button>`;
        tableBodyButton += '</td></tr>';
    }

    tableBody += tableBodyButton + '</tbody>';

    divElement.innerHTML = '<div class="table-responsive" style="margin-left: 10px; margin-right: 10px;"><table class="table table-striped table-hover table-sm">' + tableHeader + tableBody + '</table></div>';

    //обработчик на запрос удаления информации
    (function () {
        let buttonTrash = document.querySelectorAll('.glyphicon-trash');
        for (let i = 0; i < buttonTrash.length; i++) {
            let taskIndex = buttonTrash[i].parentElement.parentElement.parentElement.getAttribute('id').split('_')[1];
            buttonTrash[i].parentElement.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__openModalWindowDelete__["a" /* default */].bind(null, taskIndex));
        }
    })();

    //обработчик на получение всех данных
    (function () {
        let buttonTrash = document.querySelectorAll('.glyphicon-info-sign');
        for (let i = 0; i < buttonTrash.length; i++) {
            let taskIndex = buttonTrash[i].parentElement.parentElement.parentElement.getAttribute('id').split('_')[1];
            buttonTrash[i].parentElement.addEventListener('click', function (taskIndex) {
                socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
            }.bind(null, taskIndex));
        }
    })();

    $('[data-toggle="tooltip"]').tooltip();

    divElement.previousElementSibling.innerHTML = `всего задач найдено:<strong> ${objData.informationPaginate.countElements}</strong>`;
}

/***/ }),

/***/ 34:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = openModalWindowDelete;
/**
 * Открытие модального окна подтверждающего удаление метаданных и файлов
 * 
 * Версия 0.1, дата релиза 27.11.2017
 */



function openModalWindowDelete(taskIndex) {
  document.querySelector('#modalLabelDelete .modal-title').innerHTML = 'Удаление';
  let modalBody = document.querySelector('#modalDelete .modal-body');

  modalBody.innerHTML = `<label class="checkbox-inline" data-task-index="${taskIndex}"><input type="checkbox" id="inlineCheckboxFileDelete"> удалить все файлы, связанные с выбранными метаданными </label>`;

  $('#modalDelete').modal('show');
}

/***/ }),

/***/ 4:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return helpers; });


let helpers = {
    //настраивает высоту отступа для элемента выводящего загрузку сетевых интерфейсов
    loadNetworkMarginTop() {
        let arrayLoadNetwork = document.getElementsByName('loadNetwork');
        if (arrayLoadNetwork.hasOwnProperty('length')) return;

        for (let key in arrayLoadNetwork) {
            let countElements = 0;
            for (let i in arrayLoadNetwork[key].children) {
                countElements++;
            }
            let num = (countElements - 4) / 3;
            let px = '0px';
            if (3 <= num && num <= 5) px = '35px';
            if (1 <= num && num <= 3) px = '40px';

            if (arrayLoadNetwork[key].nodeType === 1) {
                arrayLoadNetwork[key].style.marginTop = px;
            }
        }
    },

    //конвертирование даты и времени из формата Unix в стандартный формат
    getDate(dateUnix) {
        let x = new Date().getTimezoneOffset() * 60000;
        return new Date(+dateUnix - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
    },

    //получить цвет значения
    getColor(number) {
        if (0 <= number && number <= 35) return 'color: #83B4D7;';
        if (36 <= number && number <= 65) return 'color: #9FD783;';
        if (66 <= number && number <= 85) return 'color: #E1E691;';
        if (86 <= number) return 'color: #C78888;';
    },

    //преобразование числа в строку с пробелами после каждой третьей цифры 
    intConvert(nLoad) {
        let newString = nLoad.toString();
        let interimArray = [];
        let countCycles = Math.ceil(newString.length / 3);
        let num = 0;
        for (let i = 1; i <= countCycles; i++) {
            interimArray.push(newString.charAt(newString.length - 3 - num) + newString.charAt(newString.length - 2 - num) + newString.charAt(newString.length - 1 - num));
            num += 3;
        }
        interimArray.reverse();
        return interimArray.join(' ');
    },

    //пересчет в Кбайты, Мбайты и Гбайты
    changeByteSize(byte) {
        if (3 >= byte.length) return '<strong>' + byte + '</strong> байт';else if (3 < byte.length && byte.length <= 6) return '<strong>' + (byte / 1000).toFixed(2) + '</strong> Кбайт';else if (6 < byte.length && byte.length <= 9) return '<strong>' + (byte / 1000000).toFixed(2) + '</strong> Мбайт';else return '<strong>' + (byte / 1000000000).toFixed(2) + '</strong> Гбайт';
    },

    //конвертирование даты и вермени
    dateTimeConvert(dateUnixFormat) {
        let x = new Date().getTimezoneOffset() * 60000;
        return new Date(+dateUnixFormat - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
    },

    //получить не повторяющиеся элементы двух массивов
    getDifferenceArray(arrOne, arrTwo) {
        if (arrOne.length === 0) return arrTwo;
        if (arrTwo.length === 0) return arrOne;

        let result = [];
        if (arrOne.length === arrTwo.length) {
            for (let i = 0; i < arrOne.length; i++) {
                for (let j = 0; j < arrTwo.length; j++) {
                    if (arrOne[i] === arrTwo[j]) {
                        arrOne.splice(i, 1);
                        arrTwo.splice(j, 1);
                    }
                }
            }
            result = arrOne.concat(arrTwo.join(','));
        } else if (arrOne.length < arrTwo.length) {
            let stringOne = arrOne.join(' ');
            arrTwo.filter(item => {
                return stringOne.indexOf(item.toString()) < 0;
            });
        } else {
            let stringOne = arrTwo.join(' ');
            arrOne.filter(item => {
                return stringOne.indexOf(item.toString()) < 0;
            });
        }
        return result;
    },

    //проверка данных полученных от пользователя
    checkInputValidation(elem) {
        let objSettings = {
            'hostId': new RegExp('^[0-9]{1,7}$'),
            'shortNameHost': new RegExp('^[a-zA-Z0-9_№"\\-\\s]{3,15}$'),
            'fullNameHost': new RegExp('^[a-zA-Zа-яА-Яё0-9_№"\\-\\s\\.,]{5,}$'),
            'ipaddress': new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$'),
            'port': new RegExp('^[0-9]{1,5}$'),
            'countProcess': new RegExp('^[0-9]{1}$'),
            'intervalTransmission': new RegExp('^[0-9]{1,}$')
        };
        let pattern = objSettings[elem.name];

        if (elem.name === 'port') {
            if (!(0 <= elem.value && elem.value < 65536)) return false;
        }
        if (elem.name === 'intervalTransmission' && elem.value < 10) return false;
        return !pattern.test(elem.value) ? false : true;
    },

    //генератор токена
    tokenRand() {
        return Math.random().toString(14).substr(2) + Math.random().toString(14).substr(2);
    }
};



/***/ }),

/***/ 53:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = getBodyJournalOfFiltrations;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__processPagination__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__job_log_createTableTaskResultFilter__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__upload_files_log_createTableTaskUploadedFiles__ = __webpack_require__(33);
/**
 * Формирование таблицы с данными и пагинатор
 * 
 * Версия 0.1, дата релиза 23.11.2017
 */







function getBodyJournalOfFiltrations(pageName, informationTasks) {
    let objCreateTables = {
        'job_log': {
            'create table': __WEBPACK_IMPORTED_MODULE_1__job_log_createTableTaskResultFilter__["a" /* default */],
            'emit message': 'show the page number filtering'
        },
        'uploaded_files_log': {
            'create table': __WEBPACK_IMPORTED_MODULE_2__upload_files_log_createTableTaskUploadedFiles__["a" /* default */],
            'emit message': 'show the page number upload files'
        }
    };

    function isEmptyObject(obj) {
        return Object.keys(obj).length === 0 ? true : false;
    }

    //формирование нового пагинатора
    function createPaginate(data) {
        let pagination = `всего заданий: <strong>${data.informationPaginate.countElements}</strong><nav>`;
        pagination += '<ul class="pagination"><li class="page-item disabled"><a class="page-link" data-chunk="previous" href="#" aria-label="Previous">&laquo;</a></li>';

        for (let num = 1; num <= data.informationPaginate.countChunks; num++) {
            if (data.informationPaginate.chunksNumber === num) {
                pagination += `<li class="page-item active"><a class="page-link" data-chunk="${num}" number-label="" href="#">${num}</a></li>`;
            } else {
                pagination += `<li class="page-item"><a class="page-link" data-chunk="${num}" number-label="" href="#">${num}</a></li>`;
            }
        }
        pagination += '<li class="page-item"><a class="page-link" data-chunk="next" href="#" aria-label="Next">&raquo;</a></li></ul></nav>';
        document.getElementById('field_pagination').innerHTML = pagination;

        let divPagination = document.getElementsByClassName('pagination')[0];
        if (typeof divPagination !== 'undefined') divPagination.addEventListener('click', __WEBPACK_IMPORTED_MODULE_0__processPagination__["a" /* default */].bind(objCreateTables[pageName]['emit message']));
    }

    if (isEmptyObject(informationTasks)) {
        let divInformationNotFound = '<div class="text-center"><h4 class="text-uppercase" style="margin-top: 100px; color: #ef5734">нет данных</h4></div>';
        document.getElementById('field_table').innerHTML = divInformationNotFound;
        document.getElementById('field_pagination').innerHTML = '';
        return;
    }
    //создаем новую таблицу с данными
    objCreateTables[pageName]['create table'](informationTasks);

    if (informationTasks.hasOwnProperty('informationTaskIndex') && informationTasks.informationPaginate.countChunks > 1) {
        createPaginate(informationTasks);
    } else {
        document.getElementById('field_pagination').innerHTML = '';
    }
}

/***/ }),

/***/ 7:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Управление постраничными ссылками
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */



/* harmony default export */ __webpack_exports__["a"] = (function (event) {
    if (event.target.tagName !== 'A') return;
    let emitMessage = this;

    let currentTargetParentNode = event.target.parentNode;
    if (currentTargetParentNode.tagName === 'LI' && currentTargetParentNode.classList.contains('disabled') === true) return;

    //всего цифровых слекторов
    let allChunk = document.querySelectorAll('.pagination .page-link[number-label]');

    let linkNow = document.querySelector('.pagination .active');

    let chunkNumberNow = linkNow.children[0].dataset.chunk;

    function changeSideSelectors(chunkClick) {
        socket.emit(emitMessage, { processingType: 'showPageNumber', pageNumber: chunkClick });

        let targetLink = event.target.dataset.chunk;
        let stringLinks = document.querySelectorAll('.pagination .page-link[aria-label]');

        //не выделяем селекторы previous и next
        if (targetLink !== 'next' && targetLink !== 'previous') {
            linkNow.classList.remove('active');
            currentTargetParentNode.classList.add('active');
        }

        //если селекторы крайние делаем previous или next не активными
        if (+chunkClick === 1) {
            stringLinks[0].parentNode.classList.add('disabled');
            stringLinks[1].parentNode.classList.remove('disabled');
            return;
        } else if (+chunkClick === allChunk.length) {
            stringLinks[0].parentNode.classList.remove('disabled');
            stringLinks[1].parentNode.classList.add('disabled');
            return;
        } else if (1 < +chunkClick && +chunkClick < allChunk.length) {
            stringLinks[0].parentNode.classList.remove('disabled');
            stringLinks[1].parentNode.classList.remove('disabled');
            return;
        }
    }

    function removeClassActive() {
        let linkActive = document.querySelectorAll('.pagination .active');
        for (let i = 0; i < linkActive.length; i++) {
            linkActive[i].classList.remove('active');
        }
    }

    let chunkClick = event.target.dataset.chunk;
    removeClassActive();

    //перемещаем указатель по цифрам используя селекторы previous и next
    if (chunkClick === 'next') {
        if (typeof allChunk[chunkNumberNow] === 'undefined') return;

        allChunk[chunkNumberNow].parentNode.classList.add('active');
        changeSideSelectors(document.querySelector('.pagination .active').children[0].dataset.chunk);
    } else if (chunkClick === 'previous') {
        if (typeof allChunk[chunkNumberNow - 2] === 'undefined') return;

        allChunk[chunkNumberNow - 2].parentNode.classList.add('active');
        changeSideSelectors(document.querySelector('.pagination .active').children[0].dataset.chunk);
    } else {
        changeSideSelectors(chunkClick);
    }
});

/***/ }),

/***/ 97:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = submitQuery;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_showNotify__ = __webpack_require__(2);
/**
 * Подготовка и отправка поискового запроса
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */





function submitQuery() {
    let arrayChoiceQuerySelector = [];

    let divDateTimeStart = document.getElementById('dateTimeStart');
    let dateTimeStart = divDateTimeStart.firstElementChild.value;

    let divDateTimeEnd = document.getElementById('dateTimeEnd');
    let dateTimeEnd = divDateTimeEnd.firstElementChild.value;

    let divSelect = document.querySelector('.chosen-select');
    let arrayOptions = divSelect.options;

    for (let i = 0; i < arrayOptions.length; i++) {
        if (arrayOptions[i].selected === true) {
            arrayChoiceQuerySelector.push(arrayOptions[i].value);
        }
    }

    let dateTimeIsEmpty = dateTimeStart.length === 0 || dateTimeEnd.length === 0;

    if (dateTimeIsEmpty && arrayChoiceQuerySelector.length === 0) {
        return Object(__WEBPACK_IMPORTED_MODULE_0__common_helpers_showNotify__["a" /* showNotify */])('warning', 'не задан ни один из параметров поиска');
    }
    socket.emit('search all tasks index', {
        dateTimeStart: dateTimeStart,
        dateTimeEnd: dateTimeEnd,
        querySelector: arrayChoiceQuerySelector
    });

    document.getElementById('field_table').innerHTML = '<div class="col-md-12 text-center" style="margin-top: 30px;"><img src="/public/images/img_search_1.gif"></div>';
    document.getElementById('field_pagination').innerHTML = '';
}

/***/ }),

/***/ 98:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Шаблон для формирования запроса на скачивание файлов
 * 
 * Версия 0.1, дата релиза 02.06.2018
 */



class ParametersRequestDownloadFiles {
    constructor(id) {
        this.id = id;
    }

    getElementId() {
        let element = document.getElementById(this.id);

        return element !== null ? element : false;
    }

    getDataSet(dataSetName) {
        let element = this.getElementId();
        if (!element || element.dataset === null) return '';

        let targetValue = element.dataset[dataSetName];

        if (targetValue === null) return '';

        return targetValue;
    }

    getObjectData(listName) {
        let objResult = {};
        listName.forEach(element => {
            objResult[element] = this.getDataSet(element);
        });

        return objResult;
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ParametersRequestDownloadFiles;


/***/ })

},[158]);
//# sourceMappingURL=jobLog.js.map