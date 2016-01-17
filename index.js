var fs = require('fs');
var jsdom = require("jsdom");

var url = 'http://www.neimanmarcus.com/en-il/Dresses/cat43810733_cat17740747_cat000001/c.cat';
var out = './output/';

var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.js", "utf-8");

function getUrl(url, callback) {
    jsdom.env({url: url, src: [jquery], done: callback});
}

function parseProduct(url) {
    getUrl(url, function (err, window) {
        var jQuery = window.$ || window.jQuery;

        (function (old) {
            jQuery.fn.attr = function () {
                if (arguments.length === 0) {
                    if (this.length === 0) {
                        return null;
                    }
                    var obj = {};
                    jQuery.each(this[0].attributes, function () {
                        if (this.specified) {
                            obj[this.name] = this.value;
                        }
                    });
                    return obj;
                }
                return old.apply(this, arguments);
            };
        })(jQuery.fn.attr);

        function getSelectValues(selector) {
            var result = [];
            jQuery(jQuery(selector)[0]).find('option').each(function () {
                if (jQuery(this).val().trim()) {
                    result.push(jQuery(this).val());
                }
            });
            console.log(result);
            return result;
        }

        function getItemProp() {
            var itemprop = {};
            var result = {};
            jQuery('[itemprop]').each(function () {
                itemprop[jQuery(this).attr('itemprop')] = true;
            });
            var props = Object.keys(itemprop);
            props.map(function (prop) {
                result[prop] = [];
                jQuery('[itemprop=' + prop + ']').each(function () {
                    result[prop].push(jQuery(this).attr());
                });
            });
            return result;
        }

        var product = getItemProp();
        product.id = jQuery(jQuery("img[data-product-id^='prod']")[0]).attr('data-product-id');
        product.sizes = getSelectValues('.sizeSelectBox');
        product.colors = getSelectValues('.colorSelectBox');
        product.price = product.price || [];
        product.price.push({
            text: jQuery('.product-price').text().trim(),
            retail: jQuery('[name=retail0]').val()
        });

        fs.writeFile(out + product.id + '_' + (+new Date()) + '.json', JSON.stringify(product, null, 4), function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("JSON saved to " + out + product.id + '.json');
            }
        });
    });
}

getUrl(url, function (err, window) {
    var $ = window.$;
    $('.category-item').each(function () {
        parseProduct(window.location.origin + $(this).find('a').attr('href'));
    });
});
