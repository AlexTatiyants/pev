# Postgres Explain Visualizer (pev)

Postgres Explain Visualizer (dev) is designed to make [EXPLAIN](http://www.postgresql.org/docs/current/static/sql-explain.html) output easier to grok. It creates a graphical representation of the plan.

Pev is heavily influenced by the excellent [explain.depesz.com](http://explain.depesz.com/).

Pev is written in [angular 2](https://angular.io/) with TypeScript. It requires [npm](https://www.npmjs.com/), [gulp](), [tsd](http://definitelytyped.org/tsd/), and [compass](http://compass-style.org/).

## Installation

```
npm install
npm start
```

You may also need to install tsd and compass:

```
npm install tsd -g
gem install compass
```