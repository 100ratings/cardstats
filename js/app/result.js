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
        var colors = ["black", "red", "black", "red"];
        
        var targetOdds = 2700 + k;
        var seedBase = (card * 1000) + (suit * 100) + n;

        var finalCardOdds, finalPosOdds;
        var found = false;

        // Gerar um ponto de partida aleatório mas fixo (baseado na semente) entre 51.10 e 52.90
        // Isso garante que a carta não seja sempre 51.00 ou 52.00
        var startC = 51.10 + (seededRandom(seedBase + 500) * 1.80);
        
        // Procurar por um par de números com 2 casas decimais que multiplicados deem o alvo
        // Expandimos a busca a partir do ponto inicial
        for (var offset = 0; offset <= 2.00; offset += 0.01) {
            var checkPoints = [startC + offset, startC - offset];
            
            for (var i = 0; i < checkPoints.length; i++) {
                var c = parseFloat(checkPoints[i].toFixed(2));
                if (c < 50.00 || c > 54.00) continue;

                var pNeeded = targetOdds / c;
                var pRounded = Math.round(pNeeded * 100) / 100;
                
                if (Math.round(c * pRounded) === targetOdds) {
                    finalCardOdds = c;
                    finalPosOdds = pRounded;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }

        // Fallback caso a busca falhe (muito improvável)
        if (!found) {
            finalCardOdds = 52.00;
            finalPosOdds = (targetOdds / 52.00);
        }
        
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
        for (var i = 0; i < 52; i++) {
            cardsData.push(Math.floor(seededRandom(seedBase + i) * 1000) + 500);
            positionsData.push(Math.floor(seededRandom(seedBase + i + 100) * 1000) + 500);
        }

        var stats = { cards: cardsData, positions: positionsData };
        var ticks = new Array(52), pticks = new Array(52), selCardSeries = new Array(52), selPosSeries = new Array(52);
        
        for (var x = 0; x < 52; x++) {
            ticks[x] = ""; pticks[x] = ""; selCardSeries[x] = 0; selPosSeries[x] = 0;
        }
        
        ticks[0] = cardVal; ticks[6] = "♠"; ticks[13] = cardVal; ticks[19] = "<font color='red'>♥</font>";
        ticks[26] = cardVal; ticks[32] = "♣"; ticks[39] = cardVal; ticks[45] = "<font color='red'>♦</font>";
        pticks[0] = "1"; pticks[12] = "13"; pticks[25] = "26"; pticks[38] = "39"; pticks[51] = "52";

        var suitHighlightMap = [6, 19, 32, 45];
        var cardIdx = suitHighlightMap[suit];
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
            series: [{ label: " " }, { label: " ", color: "#FF0000" }],
            axes: {
                xaxis: { renderer: $.jqplot.CategoryAxisRenderer, showTicks: true },
                yaxis: { showTicks: false, pad: 0 }
            },
            grid: { drawGridLines: false, background: '#FFFDF6', borderWeight: 0, shadow: false }
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
            color: '#000', speed: 1, trail: 60, shadow: false, hwaccel: false,
            className: 'spinner', zIndex: 2e9, top: '50%', left: '50%'
        }).spin(document.getElementById('tbody'));
        window.spinner = s;
        return s;
    }
});
