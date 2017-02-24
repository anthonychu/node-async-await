let express = require('express');
let fetch = require('node-fetch');

let app = express();


// async/await version

async function getUserAsync(username) {
  let res = await fetch('https://api.github.com/users/' + username);
  return { user: await res.json(), found: res.status === 200 };
}

async function getObjectAsync(url) {
  return (await fetch(url)).json();
}

app.get('/api/async-await/users/:username', async (req, res) => {
  try {
    let {username} = req.params;
    let userResult = await getUserAsync(username);

    if (!userResult.found) {
      res.status(404).end();
      return;
    }

    let {user} = userResult;
    let {repos_url, followers_url} = user;
    let [repos, followers] = await Promise.all([getObjectAsync(repos_url), getObjectAsync(followers_url)]);
    user.repos = repos;
    user.followers = followers;
    res.send(user);
  } catch (e) {
    res.status(500).end();
  }
});


// promises version

function getUser(username) {
  return fetch('https://api.github.com/users/' + username)
    .then(res => {
      return res.json()
        .then(user => {
          return { user, found: res.status === 200 }
        });
    });
}

function getObject(url) {
  return fetch(url).then(res => res.json());
}

app.get('/api/promises/users/:username', (req, res) => {
  let {username} = req.params;
  getUser(username)
    .then(userResult => {
      if (!userResult.found) {
        res.status(404).end();
        return;
      }

      let {user} = userResult;
      let {repos_url, followers_url} = user;
      return Promise.all([getObject(repos_url), getObject(followers_url)])
        .then(results => {
          let [repos, followers] = results;
          user.repos = repos;
          user.followers = followers;
          res.send(user);
        })
    })
    .catch(e => res.status(500).end());
});

let port = process.env.PORT || 3000;
app.listen(port, () => 
  console.log(`Example app listening on port ${port}!`));
