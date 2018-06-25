var fs = require("fs");
var _ = require("lodash");
var path = require("path")

var l10n = { 
    translations: {
        "en": {}
    }
}
var getTranslationsFromFile = function(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        console.log(new Error(JSON.stringify({
            "file": file,
            "message": "Translation file is not having proper JSON format",
            "error": e.message
        })));
    }
}

// Loading translation
l10n.translations["en"] = _.merge(l10n.translations["en"], getTranslationsFromFile(path.join(__dirname,"en.json")));
l10n.translations["fr"] = _.merge(l10n.translations["fr"], getTranslationsFromFile(path.join(__dirname,"fr.json")));
l10n.translations["sp"] = _.merge(l10n.translations["sp"], getTranslationsFromFile(path.join(__dirname,"sp.json")));
l10n.translations["de"] = _.merge(l10n.translations["de"], getTranslationsFromFile(path.join(__dirname,"de.json")));

/**
 * 
 * @param {string} lang fr|en|de|sp
 * @param {string} key key of the message
 * @param {json} obj 
 */
l10n.t = function (lang, key, obj) {
    var locale = this.locale ? this.locale : l10n.locale;
    var translation = l10n.translations[lang][key];
    if (translation) {
        _.forEach(obj, function (value, key) {
            translation = translation.replace(new RegExp('{{'+key+'}}', 'g'), value);
        });
    }
    return translation ? translation : new Error("Translation not found for " + key);
}

var getTranslationsFromFile = function(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        console.log(new Error(JSON.stringify({
            "file": file,
            "message": "Translation file is not having proper JSON format",
            "error": e.message
        })));
    }
}

module.exports = l10n;