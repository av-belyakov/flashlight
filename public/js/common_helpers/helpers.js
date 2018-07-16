'use strict';

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
        let x = (new Date()).getTimezoneOffset() * 60000;
        return (new Date((+dateUnix - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, ''));
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
        let countCycles = Math.ceil((newString.length / 3));
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
        if (3 >= byte.length) return '<strong>' + byte + '</strong> байт';
        else if (3 < byte.length && byte.length <= 6) return '<strong>' + (byte / 1000).toFixed(2) + '</strong> Кбайт';
        else if (6 < byte.length && byte.length <= 9) return '<strong>' + (byte / 1000000).toFixed(2) + '</strong> Мбайт';
        else return '<strong>' + (byte / 1000000000).toFixed(2) + '</strong> Гбайт';
    },

    //конвертирование даты и вермени
    dateTimeConvert(dateUnixFormat) {
        let x = (new Date()).getTimezoneOffset() * 60000;
        return (new Date((+dateUnixFormat - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, ''));
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
            arrTwo.filter((item) => {
                return stringOne.indexOf(item.toString()) < 0;
            });
        } else {
            let stringOne = arrTwo.join(' ');
            arrOne.filter((item) => {
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
        if (elem.name === 'intervalTransmission' && (elem.value < 10)) return false;
        return (!pattern.test(elem.value)) ? false : true;
    },

    //генератор токена
    tokenRand() {
        return (Math.random().toString(14).substr(2)) + (Math.random().toString(14).substr(2));
    }
};

export { helpers };