/*
 * Модуль создания виджета визуализирующего загрузку файлов
 * 
 * Версия 0.1, дата релиза 16.11.2017
 * */

'use strict';

export default function(objData) {
    //создаем заголовок с номером источника
    let divSourceNumber = document.createElement('div');
    divSourceNumber.appendChild(document.createTextNode('Источник №' + objData.sourceId));
    divSourceNumber.classList.add('text-center');

    //подзаголовок с кратким описанием источника
    let divSourceShortName = document.createElement('div');
    divSourceShortName.appendChild(document.createTextNode(objData.shortName));
    divSourceShortName.classList.add('text-center');

    //создаем место где в дальнейшем будет распологатся шкала прогресса
    let divProgress = document.createElement('div');
    divProgress.setAttribute('id', 'progress:' + objData.taskIndex);

    //создаем элемент с информацией по файлам
    let divFilesInformation = document.createElement('div');
    divFilesInformation.classList.add('text-center');
    divFilesInformation.style.marginTop = '-10px';
    divFilesInformation.setAttribute('id', 'file_information:' + objData.taskIndex);

    //дополнительный div элемент
    let divTwo = document.createElement('div');
    divTwo.classList.add('col-md-12');
    divTwo.style.color = '#ccd1d9';

    //формируем основной div элемент
    let divOne = document.createElement('div');
    divOne.setAttribute('style', 'margin-bottom: 5px; height: 110px; padding-top: 10px; background: white; box-shadow: 1px 1px 1px grey; cursor: pointer');
    divOne.setAttribute('id', 'download:' + objData.taskIndex);
    divOne.setAttribute('data-source-id', objData.taskIndex.split(':')[1]);

    divTwo.appendChild(divSourceNumber);
    divTwo.appendChild(divSourceShortName);
    divTwo.appendChild(divProgress);
    divTwo.appendChild(divFilesInformation);
    divOne.appendChild(divTwo);

    let leftContent = document.getElementById('leftContent');
    leftContent.appendChild(divOne);
}