/*
 * Модуль визуализации фильтрации
 * 
 * Версия 1.0, дата релиза 16.11.2017 
 * */

'use strict';

export default function(objData) {
    let percent = Math.ceil((+objData.information.countFilesProcessed * 100) / +objData.information.countFilesFiltering) + '%';

    let obj = {
        'taskIndex': objData.information.taskIndex,
        'sourceId': objData.information.sourceId,
        'countFilesFound': objData.information.countFilesFound,
        'countFilesFiltering': objData.information.countFilesFiltering,
        'countFilesProcessed': objData.information.countFilesProcessed,
        'percent': percent
    };

    let idTaskIndex = document.getElementById(objData.information.taskIndex);

    if (idTaskIndex === null) createElementInformationFiltering(obj);
    else changeElementInformationFiltering(obj);
}

//изменение элемента визуализирующего ход фильтрации
function changeElementInformationFiltering(objData) {
    let elementTaskIndex = document.getElementById(objData.taskIndex);
    let divProgressBar = elementTaskIndex.getElementsByClassName('progress-bar')[0];

    divProgressBar.style.width = objData.percent;
    divProgressBar.innerHTML = objData.countFilesProcessed + '/' + objData.countFilesFiltering;
    elementTaskIndex.children[0].lastElementChild.innerHTML = 'Найдено файлов: ' + objData.countFilesFound;
}

//создание елемента визуализирующего ход фильтрации
function createElementInformationFiltering(objData) {
    //создаем заголовок с номером источника
    let divSourceNumber = document.createElement('div');
    divSourceNumber.appendChild(document.createTextNode('Источник №' + objData.sourceId));
    divSourceNumber.classList.add('text-center');

    //создаем шкалу прогресса
    let divProgressBar = document.createElement('div');
    divProgressBar.classList.add('progress-bar');
    divProgressBar.style.width = objData.percent;
    divProgressBar.appendChild(document.createTextNode(objData.countFilesProcessed + '/' + objData.countFilesFiltering));
    divProgressBar.setAttribute('aria-valuenow', 0);
    divProgressBar.setAttribute('aria-valuemin', 0);
    divProgressBar.setAttribute('aria-valuemax', 100);
    let divProgress = document.createElement('div');
    divProgress.classList.add('progress');
    divProgress.style.marginTop = '10px';
    divProgress.appendChild(divProgressBar);

    //создаем элемент с информацией по файлам
    let divFilesInformation = document.createElement('div');
    divFilesInformation.classList.add('text-center');
    divFilesInformation.style.marginTop = '-10px';
    divFilesInformation.innerHTML = 'Найдено файлов: ' + objData.countFilesFound;

    //дополнительный div элемент
    let divTwo = document.createElement('div');
    divTwo.classList.add('col-md-12');
    divTwo.style.color = '#ccd1d9';

    //формируем основной div элемент
    let divOne = document.createElement('div');
    divOne.setAttribute('style', 'margin-bottom: 5px; height: 95px; padding-top: 10px; background: white; box-shadow: 1px 1px 1px grey; cursor: pointer');
    divOne.setAttribute('id', objData.taskIndex);
    divOne.setAttribute('data-source-id', objData.taskIndex);

    divTwo.appendChild(divSourceNumber);
    divTwo.appendChild(divProgress);
    divTwo.appendChild(divFilesInformation);
    divOne.appendChild(divTwo);

    let leftContent = document.getElementById('leftContent');
    leftContent.appendChild(divOne);
}