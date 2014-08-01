var request = require('request');
var cheerio = require('cheerio');
var redis 	= require('redis').createClient();
var Twit 	= require('twit');
var config 	= require('./config');

var T = new Twit({
    consumer_key:         config.consumer_key,
  	consumer_secret:      config.consumer_secret,
    access_token:         config.access_token,
    access_token_secret:  config.access_token_secret
});

var myntraEndPoint = 'http://www.myntra.com/new-arrivals?sort=new';
function crawlMyntra() {
	request.get(myntraEndPoint, function(err, response, body) {
		if(!err && response.statusCode == 200) {
			var $ = cheerio.load(body);
			$('ul.results li').each(function(i, elem) {
			  	var product_id = $(this).attr('data-styleid');
			  	var link = 'http://www.myntra.com/' + product_id;
			  	var brand = $(this).find('a div.brand').text();
			  	var product = $(this).find('a div.product').text();
			  	var price = $(this).find('a div.price').contents();
			  	if(price.length > 1) {
			  		price = price.eq(1).text();
			  	} else {
			  		price = price.text();
			  	}
			  	var value = brand + ' ' + product + ' for ' + price + ' at #myntra ' + link;
			  	publish('myntra', product_id, value);
			});
		}
	});
};

function publish(hash, key, value) {
	redis.hset(hash, key, value, function(err, reply) {
		if(!err && reply == 1) {
			T.post('statuses/update', { status: value }, function(err, response) {
				if(err) console.log(err);
			});
		}
	});
};

setInterval(crawlMyntra, config.crawl_interval);