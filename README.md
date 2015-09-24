### bb-bower-resolver

Backbase Launchpad [pluggable Resolver](http://bower.io/docs/pluggable-resolvers/) for [bower](http://bower.io)

#### Requirements

* nodejs/npm
* bower v1.5+

#### Install

You can install it either globally:

```
npm install --global bb-bower-resolver
```

or add it as a `devDependency` to your `package.json` file.

#### Usage

Add `bb-bower-resolver` to the resolver list in [.bowerrc](http://bower.io/docs/config/)

```
...
  "resolvers": [
    "filesystem-bower-resolver",
    "bb-bower-resolver"
  ]
```

If you need to change default settings (shown below), add Backbase specific properties to the `.bowerrc` file:

```
...
  "backbase": {
    "url": "https://repo.backbase.com",
    "repoPath": "backbase-development-internal-releases/com/backbase/launchpad/components/"
  }
```

Optional backbase properties are `username` and `password`. 
If you are using maven password encryption, you will need to specify your decrypted password for the resolver to work.
