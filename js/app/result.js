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
        
        // --- LÓGICA DE PRECISÃO MATEMÁTICA ABSOLUTA (2 CASAS) ---
        var targetOdds = 2700 + k;
        
        var finalCardOdds, finalPosOdds;
        var found = false;

        // Tentar encontrar dois números com 2 casas decimais que multiplicados deem o alvo
        // Começamos perto de 52 e expandimos a busca se necessário
        for (var c = 51.00; c <= 53.00; c += 0.01) {
            var cFixed = parseFloat(c.toFixed(2));
            var pNeeded = targetOdds / cFixed;
            var pRounded = Math.round(pNeeded * 100) / 100;
            
            // Verificamos se a multiplicação dos arredondados dá o alvo
            if (Math.round(cFixed * pRounded) === targetOdds) {
                finalCardOdds = cFixed;
                finalPosOdds = pRounded;
                found = true;
                break;
            }
        }

        // Fallback de segurança (caso a busca falhe, o que é raro)
        if (!found) {
            finalCardOdds = 52.00;
            finalPosOdds = (targetOdds / 52.00);
        }
        
        var cardPerc = (100 / finalCardOdds).toFixed(2);
        var posPerc = (100 / finalPosOdds).toFixed(2);
        var sampleSize = 125643;
        
        // Atualizar UI
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
        renderCharts(card, suit, n, cardShort[card]);
    }

    function renderCharts(card, suit, n, cardVal) {
        var stats = {
            cards: Array.from({length: 52}, () => Math.floor(Math.random() * 1000) + 500),
            positions: Array.from({length: 52}, () => Math.floor(Math.random() * 1000) + 500)
        };

        var ticks = new Array(52);
        var pticks = new Array(52);
        var selCardSeries = new Array(52);
        var selPosSeries = new Array(52);
        
        for (var x = 0; x < 52; x++) {
            ticks[x] = "";
            pticks[x] = "";
            selCardSeries[x] = 0;
            selPosSeries[x] = 0;
        }
        
        ticks[0] = cardVal;
        ticks[6] = "♠";
        ticks[13] = cardVal;
        ticks[19] = "<font color='red'>♥</font>";
        ticks[26] = cardVal;
        ticks[32] = "♣";
        ticks[39] = cardVal;
        ticks[45] = "<font color='red'>♦</font>";

        pticks[0] = "1";
        pticks[12] = "13";
        pticks[25] = "26";
        pticks[38] = "39";
        pticks[51] = "52";

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
            series: [
                { label: " " },
                { label: " ", color: "#FF0000" }
            ],
            axes: {
                xaxis: {
                    renderer: $.jqplot.CategoryAxisRenderer,
                    showTicks: true
                },
                yaxis: { showTicks: false, pad: 0 }
            },
            grid: { 
                drawGridLines: false, 
                background: '#FFFDF6', 
                borderWeight: 0, 
                shadow: false 
            }
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
