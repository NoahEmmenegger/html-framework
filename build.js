const fs = require('fs');
const config = require('./config.json')
const translations = require('./translations.json')

if(fs.existsSync('build')) {
    fs.rmdirSync('build', {recursive: true })
}

const buildFolder = fs.mkdirSync('build')

const everyFiles = []


function translate(key, language) {
    return translations[key][language]
}

function recursiveFileSearch(path) {
    let files = fs.readdirSync(path, {withFileTypes: true})
    files.forEach(file => {
        if(file.isDirectory()){
            if(!file.name.startsWith('.') && file.name !== 'build')
            {
                recursiveFileSearch(`${path}/${file.name}`)
            }
        } else {
            if(!file.name.startsWith('.') && file.name !== 'build.js' && file.name !== 'config.json' && file.name !== 'translations.json') {
                everyFiles.push({name: file.name, path: path})
            }
        }
    })
}

function getTranslatedContent(file, language) {
    let content =  fs.readFileSync(file)
    let string = content.toString()

    // translate
    let matches = string.match(/translate\((.*?)\)/g)
    if(matches !== null) {
        matches.forEach(match => {
            let key = match.match(/\((.*?)\)/g).toString().slice(1, -1)
            string = string.replace(`translate(${key})`, translate(key, language))
        })
    }

    // add html lan
    string = string.replace('<html>', `<html lang="${language}">`)

    // add hreflang
    let hreflangs = ''
    config.languages.forEach(lang => {
        if(lang !== language) {
            if(lang == config.defaultLanguage) {
                hreflangs += `\n    <link rel="alternate" hreflang="${lang}" href="${config.domain}/${file}">`
            }else {
                hreflangs += `\n    <link rel="alternate" hreflang="${lang}" href="${config.domain}/${lang}/${file}">`
            }
        }
    })
    string = string.replace('<!--HrefLang-->', '<!--HrefLang-->' + hreflangs)

    return string
}

recursiveFileSearch('.')

config.languages.forEach((language) => {
    if(language !== config.defaultLanguage) {
        fs.mkdirSync(`build/${language}`)

        everyFiles.forEach((file) => {
            if(file.name.endsWith('.html')) {
                if(!fs.existsSync(`build/${language}/${file.path}`)) {
                    fs.mkdirSync(`build/${language}/${file.path}`)
                }
                fs.writeFileSync(`build/${language}/${file.path}/${file.name}`, getTranslatedContent(`${file.path}/${file.name}`, language))
            }
        })
    } else {
        everyFiles.forEach((file) => {
            if(file.name.endsWith('.html')) {
                if(!fs.existsSync(`build/${file.path}`)) {
                    fs.mkdirSync(`build/${file.path}`)
                }
                fs.writeFileSync(`build/${file.path}/${file.name}`, getTranslatedContent(`${file.path}/${file.name}`, 'en'))
            }
        })
    }
})

function copyDir(from, to) {
    if(!fs.existsSync(`build/assets`)) {
        fs.mkdirSync(`build/assets`)
    }
    everyFiles.filter(file => file.path.startsWith('./assets')).forEach(file => {
        if(!fs.existsSync(`build/${file.path}`)) {
            fs.mkdirSync(`build/${file.path}`)
        }
        fs.writeFileSync(`build/${file.path}/${file.name}`, fs.readFileSync(`${file.path}/${file.name}`))
    })
}


if(fs.existsSync('./assets')) {
    copyDir('./assets', './build/assets')
}

fs.readdirSync('.').filter(file => !file.endsWith('.html') && !fs.lstatSync(file).isDirectory() && !file.startsWith('.') && file !== 'build.js' && file !== 'config.json' && file !== 'translations.json').forEach(file => {
    fs.writeFileSync(`build/${file}`, fs.readFileSync(`./${file}`))
})


return
