# Genkan 玄関

Genkan is a session based authentication system written in NodeJS and uses MongoDB as its database.

> ### ⚠️ Don't implement Genkan in any production environment (just yet!)
> This project is still heavily in development. It is highly and extremely discouraged to use Genkan in any production environment.

## Why use Genkan

Genkan is made to be easily implementable across any Node application regardless of scale. A Node application can simply check for the browser cookie against the session ID stored in MongoDB to check for login state.

## Download

You can download Genkan using the following options:

### NPM
```
npm i genkan
```

**or**

### Git Clone
```
git clone https://github.com/HakkouHQ/Genkan.git
```

## Setup

Install all necessary node modules with the following command. 
The default theme for Genkan, [Uchi](https://github.com/TanukiHQ/genkan-theme-uchi), will be installed as well.

```
npm i
```

### Next,
```
node app.js
```

**or**

```
nodemon
```

Running Genkan for the first time will generate a `config.json` file.

Run Genkan again with the following command above and open `http://localhost:5000/login` in your browser.

## License
- [GPL-3.0 License](https://www.gnu.org/licenses/gpl-3.0.en.html)
