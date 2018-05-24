/**
 * Управление постраничными ссылками
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */

'use strict';

export default function(event) {
    if (event.target.tagName !== 'A') return;
    let emitMessage = this;

    let currentTargetParentNode = event.target.parentNode;
    if ((currentTargetParentNode.tagName === 'LI') && (currentTargetParentNode.classList.contains('disabled') === true)) return;

    //всего цифровых слекторов
    let allChunk = document.querySelectorAll('.pagination .page-link[number-label]');

    let linkNow = document.querySelector('.pagination .active');

    let chunkNumberNow = linkNow.children[0].dataset.chunk;

    function changeSideSelectors(chunkClick) {
        socket.emit(emitMessage, { processingType: 'showPageNumber', pageNumber: chunkClick });

        let targetLink = event.target.dataset.chunk;
        let stringLinks = document.querySelectorAll('.pagination .page-link[aria-label]');

        //не выделяем селекторы previous и next
        if ((targetLink !== 'next') && (targetLink !== 'previous')) {
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
        } else if ((1 < +chunkClick) && (+chunkClick < allChunk.length)) {
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
}