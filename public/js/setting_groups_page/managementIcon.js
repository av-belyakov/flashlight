/**
 * Модуль изменения информационных иконок полей ввода
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */

'use strict';

function ManagementIcon() {
    let elemSpanIcon = document.getElementById('iconSuccess');
    this.elemSpanIcon = elemSpanIcon;
    this.parentNode = elemSpanIcon.parentNode;
}

ManagementIcon.prototype.showIcon = function(trigger) {
    if (!trigger) {
        this.elemSpanIcon.classList.remove('glyphicon-ok');
        this.parentNode.classList.remove('has-success');
        this.elemSpanIcon.classList.add('glyphicon-remove');
        this.parentNode.classList.add('has-error');
    } else {
        this.elemSpanIcon.classList.remove('glyphicon-remove');
        this.parentNode.classList.remove('has-error');
        this.elemSpanIcon.classList.add('glyphicon-ok');
        this.parentNode.classList.add('has-success');
    }
};

ManagementIcon.prototype.clearIcon = function() {
    this.elemSpanIcon.classList.remove('glyphicon-ok');
    this.parentNode.classList.remove('has-success');
    this.elemSpanIcon.classList.remove('glyphicon-remove');
    this.parentNode.classList.remove('has-error');
};

export default ManagementIcon;