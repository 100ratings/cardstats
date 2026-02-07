profileId = "";
pos = document.URL.indexOf("/a/");
if (pos != -1) {
	profileId = document.URL.substring(pos+3);
	pos = profileId.indexOf("#");
	if (pos != -1) {
		profileId = profileId.substring(0,pos);
	}
}

suits = ["Espadas","Copas","Paus","Ouros"];
cards = ["Ás","2","3","4","5","6","7","8","9","10","Valete","Dama","Rei"];
suit = 0;
card = 0;
position = 0;
posDigits = []; // 0..2 dígitos para a correção
settings = null;
cardFirst = true;

$(document).ready(function(){
	updateUI();
	$("#suitButton0").on("click touchstart", function(e) { setSuit(0); e.preventDefault(); });
	$("#suitButton1").on("click touchstart", function(e) { setSuit(1); e.preventDefault(); });
	$("#suitButton2").on("click touchstart", function(e) { setSuit(2); e.preventDefault(); });
	$("#suitButton3").on("click touchstart", function(e) { setSuit(3); e.preventDefault(); });
	
	$("#cardButton0").on("click touchstart", function(e) { setCard(0); e.preventDefault(); });
	$("#cardButton1").on("click touchstart", function(e) { setCard(1); e.preventDefault(); });
	$("#cardButton2").on("click touchstart", function(e) { setCard(2); e.preventDefault(); });
	$("#cardButton3").on("click touchstart", function(e) { setCard(3); e.preventDefault(); });
	$("#cardButton4").on("click touchstart", function(e) { setCard(4); e.preventDefault(); });
	$("#cardButton5").on("click touchstart", function(e) { setCard(5); e.preventDefault(); });
	$("#cardButton6").on("click touchstart", function(e) { setCard(6); e.preventDefault(); });
	$("#cardButton7").on("click touchstart", function(e) { setCard(7); e.preventDefault(); });
	$("#cardButton8").on("click touchstart", function(e) { setCard(8); e.preventDefault(); });
	$("#cardButton9").on("click touchstart", function(e) { setCard(9); e.preventDefault(); });
	$("#cardButton10").on("click touchstart", function(e) { setCard(10); e.preventDefault(); });
	$("#cardButton11").on("click touchstart", function(e) { setCard(11); e.preventDefault(); });
	$("#cardButton12").on("click touchstart", function(e) { setCard(12); e.preventDefault(); });
	
	$("#posButton0").on("click touchstart", function(e) { setPosition(0); e.preventDefault(); });
	$("#posButton1").on("click touchstart", function(e) { setPosition(1); e.preventDefault(); });
	$("#posButton2").on("click touchstart", function(e) { setPosition(2); e.preventDefault(); });
	$("#posButton3").on("click touchstart", function(e) { setPosition(3); e.preventDefault(); });
	$("#posButton4").on("click touchstart", function(e) { setPosition(4); e.preventDefault(); });
	$("#posButton5").on("click touchstart", function(e) { setPosition(5); e.preventDefault(); });
	$("#posButton6").on("click touchstart", function(e) { setPosition(6); e.preventDefault(); });
	$("#posButton7").on("click touchstart", function(e) { setPosition(7); e.preventDefault(); });
	$("#posButton8").on("click touchstart", function(e) { setPosition(8); e.preventDefault(); });
	$("#posButton9").on("click touchstart", function(e) { setPosition(9); e.preventDefault(); });

	$("#nButton").on("click touchstart", function(e) { next(); e.preventDefault(); });
	$("#sButton").on("click touchstart", function(e) { submit(); e.preventDefault(); });
	
});

function next() {
	if (cardFirst) {
		$("#cardPage").hide();
		$("#posPage").show();
        cardFirst = false;
	} else {
		$("#cardPage").show();
		$("#posPage").hide();
        cardFirst = true;
	}
}

function submit() {
	if (posDigits.length === 0) {
		alert("Por favor, selecione uma posição.");
		return;
	}
	const str = posDigits.join('');
	const n = parseInt(str, 10);
	if (n < 1 || n > 52) {
		alert("Posição inválida (deve ser entre 1 e 52)");
		posDigits = [];
		updateUI();
		return;
	}
	
	$(".title").text("Buscando resultados...");
	$(".btn").prop('disabled', true);
	spin();
	var url = "result/index.html?card=" + card + "&suit=" + suit + "&pos=" + n;
	window.location.href = url;
	return true;
}

function setCard(value) { card = value; updateUI(); }
function setSuit(value) { suit = value; updateUI(); }

function setPosition(value) {
	if (posDigits.length >= 2) posDigits = []; // reset ao terceiro clique
	posDigits.push(String(value));
	updateUI();
}

function updateUI() {
	if (card < 13)
		text = cards[card]+" de "+suits[suit];
	$("#cardText").text(text);
	
	var posDisplay = posDigits.length > 0 ? posDigits.join('') : "0";
	$("#positionText").text("Posição: " + posDisplay);

    // Highlight Card
    $(".card-grid .btn").removeClass("btn-primary");
    $("#cardButton" + card).addClass("btn-primary");

    // Highlight Suit
    $(".suit-grid .btn").removeClass("btn-primary");
    $("#suitButton" + suit).addClass("btn-primary");

    // Highlight Position
    $(".pos-grid .btn").removeClass("btn-primary");
    posDigits.forEach(function(d) {
        $("#posButton" + d).addClass("btn-primary");
    });
}

function spin() {
	var opts = {
			  lines: 13, length: 15, width: 5, radius: 20, corners: 1, rotate: 0, direction: 1,
			  color: '#fff', speed: 1, trail: 60, shadow: false, hwaccel: false,
			  className: 'spinner', zIndex: 2e9, top: '50%', left: '50%'
			};
	return new Spinner(opts).spin(document.getElementById('tbody'));
}
