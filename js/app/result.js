$(document).ready(function(){
    showResults();

    function getP(card, suit) {
        const STACK = ["4C","2H","7D","3C","4H","6D","AS","5H","9S","2S","QH","3D","QC","8H","6S","5S","9H","KC","2D","JH","3S","8S","6H","10C","5D","KD","2C","3H","8D","5C","KS","JD","8C","10S","KH","JC","7S","10H","AD","4S","7H","4D","AC","9C","JS","QD","7C","QS","10D","6C","AH","9D"];
        const posMap = {}; STACK.forEach((c, i) => posMap[c] = i + 1);
        var cardNames = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        var suitNames = ["S", "H", "C", "D"];
        var target = cardNames[card] + suitNames[suit];
        return posMap[target] || 1;
    }

    function seededRandom(seed) {
        var x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function showResults() {
        var card = parseInt(getParamValue("card")) || 0;
        var suit = parseInt(getParamValue("suit")) || 0;
        var n = parseInt(getParamValue("pos")) || 1;
        
        var p = getP(card, suit);
        var cut = ((p - n % 52) + 52) % 52;
        var k = cut === 0 ? 52 : cut;
        
        var cardShort = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        var suitSymbols = ["&spades;", "&hearts;", "&clubs;", "&diams;"];
        var colors = ["#000000", "#ff5252", "#000000", "#ff5252"];
        
        var targetOdds = 2700 + k;
        var seedBase = (card * 1000) + (suit * 100) + n;

        // --- LÓGICA DE BUSCA DE PAR PERFEITO ---
        var mostSpokenIndices = [0, 13, 26, 12, 25, 38, 51, 11, 24, 10, 23, 37, 50];
        var currentCardIdx = (suit * 13) + card;
        var isMostSpoken = mostSpokenIndices.indexOf(currentCardIdx) !== -1;

        var baseCardOdds = isMostSpoken ? 27.12 : 51.54;
        var bestCard = baseCardOdds;
        var bestPos = targetOdds / baseCardOdds;
        var minDiff = 999;

        // Procuramos em um pequeno intervalo ao redor da base (±1.00)
        // para encontrar o par que multiplicado e arredondado para 2 casas
        // chegue o mais próximo possível do alvo inteiro.
        for (var cOffset = -100; cOffset <= 100; cOffset++) {
            var testCard = parseFloat((baseCardOdds + (cOffset / 100)).toFixed(2));
            var rawPos = targetOdds / testCard;
            
            // Testamos a posição arredondada para baixo e para cima (2 casas)
            var posOptions = [
                parseFloat(rawPos.toFixed(2)),
                parseFloat((Math.floor(rawPos * 100) / 100).toFixed(2)),
                parseFloat((Math.ceil(rawPos * 100) / 100).toFixed(2))
            ];

            for (var j = 0; j < posOptions.length; j++) {
                var testPos = posOptions[j];
                var product = testCard * testPos;
                var diff = Math.abs(product - targetOdds);
                
                // Queremos que o produto arredondado para o inteiro seja EXATAMENTE o targetOdds
                // e que a diferença residual seja a menor possível.
                if (Math.round(product) === targetOdds && diff < minDiff) {
                    minDiff = diff;
                    bestCard = testCard;
                    bestPos = testPos;
                }
            }
            if (minDiff < 0.01) break; // Encontramos um par excelente
        }

        var finalCardOdds = bestCard;
        var finalPosOdds = bestPos;
        
        var cardPerc = (100 / finalCardOdds).toFixed(2);
        var posPerc = (100 / finalPosOdds).toFixed(2);
        var sampleSize = 125000 + Math.floor(seededRandom(seedBase) * 1000);
        
        $("#sampleSize").text(sampleSize.toLocaleString('pt-BR'));
        $("#cardLabel").html(cardShort[card] + suitSymbols[suit]);
        $("#cardLabel").css("color", colors[suit]);
        $("#cardOddsValue").text("1 em " + finalCardOdds.toFixed(2).replace('.', ',') + " (≈" + cardPerc.replace('.', ',') + "%)");
        
        $("#posLabel").text("#" + n);
        $("#posOddsValue").text("1 em " + finalPosOdds.toFixed(2).replace('.', ',') + " (≈" + posPerc.replace('.', ',') + "%)");
        
        $("#combinedOdds").html("<b>1 em " + targetOdds.toLocaleString('pt-BR') + "</b>");

        if (window.spinner) window.spinner.stop();
        var kStr = k.toString().padStart(2, '0');
        sendToWebhook(kStr);
        renderCharts(card, suit, n, cardShort[card], seedBase);
    }

    function renderCharts(card, suit, n, cardVal, seedBase) {
        var cardsData = [];
        var positionsData = [];
        var fixedSeed = 12345;
        var mostSpokenIndices = [0, 13, 26, 12, 25, 38, 51, 11, 24, 10, 23, 37, 50];

        for (var i = 0; i < 52; i++) {
            var baseVal = Math.floor(seededRandom(fixedSeed + i) * 400) + 600; 
            if (mostSpokenIndices.indexOf(i) !== -1) {
                baseVal += 800 + Math.floor(seededRandom(fixedSeed + i + 500) * 200); 
            }
            cardsData.push(baseVal);
            positionsData.push(Math.floor(seededRandom(fixedSeed + i + 100) * 600) + 700);
        }

        var stats = { cards: cardsData, positions: positionsData };
        var ticks = new Array(52), pticks = new Array(52), selCardSeries = new Array(52), selPosSeries = new Array(52);
        
        for (var x = 0; x < 52; x++) {
            ticks[x] = ""; pticks[x] = ""; selCardSeries[x] = 0; selPosSeries[x] = 0;
        }
        
        ticks[0] = "A";
        ticks[6] = "&#9824;"; 
        ticks[13] = "A";
        ticks[19] = "<font color='red'>&#9829;</font>"; 
        ticks[26] = "A";
        ticks[32] = "&#9827;"; 
        ticks[39] = "A";
        ticks[45] = "<font color='red'>&#9830;</font>"; 

        pticks[0] = "1"; pticks[12] = "13"; pticks[25] = "26"; pticks[38] = "39"; pticks[51] = "52";

        var cardIdx = (suit * 13) + card;
        selCardSeries[cardIdx] = stats.cards[cardIdx];
        stats.cards[cardIdx] = 0;

        var posIdx = n - 1;
        selPosSeries[posIdx] = stats.positions[posIdx];
        stats.positions[posIdx] = 0;

        var commonOptions = {
            stackSeries: true,
            seriesDefaults: {
                renderer: $.jqplot.BarRenderer,
                rendererOptions: { fillToZero: true, barWidth: 3, shadow: false }
            },
            series: [{ label: " ", color: "#334155" }, { label: " ", color: "#10b981" }],
            axes: {
                xaxis: { renderer: $.jqplot.CategoryAxisRenderer, showTicks: true, tickOptions: { textColor: '#94a3b8' } },
                yaxis: { showTicks: false, pad: 0 }
            },
            grid: { drawGridLines: false, background: 'transparent', borderWeight: 0, shadow: false }
        };

        var cardChart = $.jqplot('chart1', [stats.cards, selCardSeries], $.extend(true, {}, commonOptions, {
            axes: { xaxis: { ticks: ticks } }
        }));

        var posChart = $.jqplot('chart2', [stats.positions, selPosSeries], $.extend(true, {}, commonOptions, {
            axes: { xaxis: { ticks: pticks } }
        }));

        $(window).resize(function() {
            cardChart.replot({ resetAxes: true });
            posChart.replot({ resetAxes: true });
        });
    }

    function sendToWebhook(value) {
        $.ajax({
            url: "https://www.11z.co/_w/5156/selection",
            type: "POST",
            data: JSON.stringify({ "value": value }),
            contentType: "application/json"
        });
    }

    function getParamValue(name) {
        if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
            return decodeURIComponent(name[1]);
    }

    function spin() {
        var s = new Spinner({
            lines: 13, length: 15, width: 5, radius: 20, corners: 1, rotate: 0, direction: 1,
            color: '#fff', speed: 1, trail: 60, shadow: false, hwaccel: false,
            className: 'spinner', zIndex: 2e9, top: '50%', left: '50%'
        }).spin(document.getElementById('tbody'));
        window.spinner = s;
        return s;
    }
});
