var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var rootPath = process.argv[2];
var version, newVersion, versions;
var colors = {
  "reset" : "\033[0m",
  "red" : "\033[31m",
  "green" : "\033[32m",
  "yellow" : "\033[33m"
}

var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt(colors.reset + "\nversionador> ");

console.log("Actualizando proyecto ");
console.log("Carpeta raiz: " + rootPath);

var packagePath = path.join(rootPath, "package.json");
var bowerPath = path.join(rootPath, "bower.json");
var packageJSON = JSON.parse(fs.readFileSync(packagePath, "utf8"));
var bowerJSON = JSON.parse(fs.readFileSync(bowerPath, "utf8"));

if (packageJSON.version !== bowerJSON.version) {
    console.log(colors.red + "Para para para, ¿vos me estas diciendo que bower.json tiene la versión " + bowerJSON.version + " pero el package.json tiene la versión " + packageJSON.version + "? Es muy fuerte esto.");
} else {
    version = packageJSON.version;
    console.log(colors.green + "La version actual es: " + version);
}

rl.prompt();

rl.on('line', function(line) {
    switch(line.substr(0,10)) {
        case "ya fue":
            exit();
            break;
        case "ni idea":
        case "ayuda":
        case "help":
            printHelp();
            rl.prompt();
            break;
        case "tirate un ":
            generateNewVersion(line.substr(10,15));
            rl.prompt();
            break;
        case "como era":
            printVersion();
            rl.prompt();
            break;
        case "dale si":
            saveVersion();
            break;
        default:
            console.log("¿e? ni idea de lo que me estas hablando.");
            rl.prompt();
            break;
    }
}).on('close',function(){
    process.exit(0);
});

function generateNewVersion(versionType) {
    versions = version.split(".");

    switch (versionType){
        case "build":
            console.log(colors.green + versions[2] + " => " + ++versions[2]);
            break;
        case "minor":
            versions[2] = 0;
            console.log(colors.yellow + versions[1] + " => " + ++versions[1]);
            break;
        case "major":
            versions[2] = 0;
            versions[1] = 0;
            console.log(colors.red + versions[0] + " => " + ++versions[0]);
            break;
        default:
            console.log("Ni idea que tipo de versión es esa.");
    }

    newVersion = versions.join(".");
    console.log("La nueva version va a ser: " + newVersion);
}

function printVersion() {
    console.log(colors.red + "como te dije, " + colors.green + "la versión actual es: " + version);
    if (newVersion !== undefined) {
        console.log("y la nueva versión va a ser: " + newVersion);
    }
}

function printHelp() {
    console.log("\nya fue           => sale");
    console.log("como era         => muestra version actual y la futura");
    console.log("tirate un build  => solo cambia el ultimo numerito, arreglando la wea");
    console.log("tirate un minor  => el numerito del medio, se agregan funcionalidades con retro compatibilidad");
    console.log("tirate un major  => EL numero (el primero), cambios no retro compatibiles");
    console.log("dale si          => se " + colors.yellow + "escribe los archivos," + colors.red + " hace el commit y el copy" + colors.reset + " con la nueva version ");
}

function saveVersion() {
    if (newVersion !== undefined) {
        console.log(colors.yellow + "El punto sin retorno");
        console.log("Guardando archivos");
        var packageText = fs.readFileSync(packagePath, "utf8");
        var bowerText = fs.readFileSync(bowerPath, "utf8");
        
        var newPackage = packageText.replace(version, newVersion);
        var newBower = bowerText.replace(version, newVersion);

        console.log(colors.green + "package.json" + colors.reset);
        console.log(newPackage);
        console.log(colors.green + "bower.js" + colors.reset);
        console.log(newBower);

        fs.writeFileSync(packagePath, newPackage, 'utf8');
        fs.writeFileSync(bowerPath, newBower, 'utf8');

        commitVersion();
    } else {
        console.log(colors.red + "Aún no hay una nueva versión");
    }
}

function sendTag(url) {
    var tagUrl = url.replace("trunk", "tags/" + newVersion);
    console.log("svn copy " + url + " " + tagUrl);
    exec("svn copy -m 'Nueva version " + newVersion + " del componente' " + url + " " + tagUrl, function (error, stdout, stderr) {
        console.log(stdout);
        if (error !== null) {
            console.log('copy error: ' + error);
            rl.prompt();
        } else {
            exit();
        }
    });
}

function generateTag() {
    exec("svn info " + rootPath, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('info error: ' + error);
            rl.prompt();
        } else {
            console.log(colors.green + "Generando el tag" + colors.reset);
            var url = stdout.split("\n")[2].split(" ")[1];
            sendTag(url);
        }
    });
}

function commitVersion() {
    console.log("Commitenado nueva version");
    exec("svn commit -m 'Nueva version " + newVersion + " del componente' " + rootPath, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('info error: ' + error);
            rl.prompt();
        } else {
            console.log(stdout);
            generateTag();
        }
    });
}

function exit() {
    console.log(colors.yellow + "no vemo lo pibe" + colors.reset);
    rl.close();
}