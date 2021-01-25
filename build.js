const fs = require('fs');
const config = require('./config.json')
const translations = require('./translations.json')

if(fs.existsSync('build')) {
    fs.rmdirSync('build', {recursive: true })
}

const buildFolder = fs.mkdirSync('build')

const files = fs.readdirSync('.')


function translate(key, language) {
    return translations[key][language]
}


function getTranslatedContent(file, language) {
    let content =  fs.readFileSync(file)
    let string = content.toString()

    let matches = string.match(/translate\((.*?)\)/g)
    matches.forEach(match => {
        let key = match.match(/\((.*?)\)/g).toString().slice(1, -1)
        string = string.replace(`translate(${key})`, translate(key, language))
    })

    return string
}

config.languages.forEach((language) => {
    if(language !== config.defaultLanguage) {
        fs.mkdirSync(`build/${language}`)

        files.forEach((file) => {
            if(file.endsWith('.html')) {
                fs.writeFileSync(`build/${language}/${file}`, getTranslatedContent(file, language))
            }
        })
    } else {
        files.forEach((file) => {
            if(file.endsWith('.html')) {
                fs.writeFileSync(`build/${file}`, getTranslatedContent(file, 'en'))
            }
        })
    }
})

return
