
module.exports = (app: any, passport: any) => {
  const apiController = require('../controllers/apiController')(passport);

  app.route('/').get(apiController.home_get);
  app.route('/api/login').post(apiController.jwt_login_post);
  app.route('/api/signup').post(apiController.signup_post);
  app.route('/api/logout').get(apiController.logout_get);
  //app.route('/api/user/:userId').get(apiController.isJWTValid, apiController.get_user);
  app.route('/api/user/:userId').get(apiController.isGoogleValide, apiController.get_user);

  //app.route('/api/auth/google').get(apiController.google_login_ret);
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  //app.route('/api/auth/google/return').get(apiController.google_login_ret);
  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req: any, res: any) {
      // Successful authentication, redirect home.

      var responseHTML = '<html><head><title>Main</title></head><body></body><script>res = %value%; window.opener.postMessage(res, "*");window.close();</script></html>'
      responseHTML = responseHTML.replace('%value%', JSON.stringify({
        user: req.user
      }));
      res.status(200).send(responseHTML);


      //res.redirect('/profile');
    });

  /**
   * Testing routes
   * */
  app.route('/api/test/').get(apiController.isGoogleValide, apiController.test_get);
  app.route('/api/test_no_auth/').get(apiController.test_get);
  app.route('/api/test/').post(apiController.test_post);
  app.route('/api/test/:id').delete(apiController.test_delete);
  app.route('/**').get(apiController.home_get);
};
