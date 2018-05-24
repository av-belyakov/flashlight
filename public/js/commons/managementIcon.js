/**
 * Модуль изменения иконки при проверки полей ввода
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */

'use strict';

let managementIcon = {
    showIcon(elements, trigger) {
        let elem = elements.parentNode;
        let span = elem.parentNode.children[1];

        if (!trigger) {
            elem.parentNode.classList.add('has-error');
            elem.parentNode.classList.remove('has-success');
            span.classList.add('glyphicon-remove');
            span.classList.remove('glyphicon-ok');
        } else {
            elem.parentNode.classList.add('has-success');
            elem.parentNode.classList.remove('has-error');
            span.classList.add('glyphicon-ok');
            span.classList.remove('glyphicon-remove');
        }
    },

    removeIcon(elements) {
        let elem = elements.parentNode;
        let span = elem.parentNode.children[1];

        elem.parentNode.classList.remove('has-success');
        span.classList.remove('glyphicon-ok');
        elem.parentNode.classList.remove('has-error');
        span.classList.remove('glyphicon-remove');
    }
};

export { managementIcon };