let apiUtil = require("./api_util");
let { isEmpty } = require("./utilities");
let {
  forward: {
    enabled: configForwardEnabled,
    mode: configForwardMode,
    hostname: configForwardHostname,
    headers: configForwardHeaders
  }
} = require("./config");

const callRouteAction = route => (req, res, next) => {
  let { params, body } = req;

  let payload = {
    params,
    data: body
  };

  if (route.action) {
    route.action(payload);
  }

  next();
};

const forwardRequest = route => (req, res, next) => {
  let {
    request: {
      forward: {
        enabled: routeForwardEnabled,
        hostname: routeForwardHostname,
        headers: routeForwardHeaders
      } = {},
      path,
      method,
      payload
    }
  } = route;

  if (configForwardMode == "all" || (routeForwardEnabled && configForwardMode == "custom")) {
    let reqPayload = {
      payload,
      headers: !isEmpty(routeForwardHeaders) ? routeForwardHeaders : configForwardHeaders
    };

    //console.log("reqPayload", reqPayload);

    let hostname = !isEmpty(routeForwardHostname) ? routeForwardHostname : configForwardHostname;
    apiUtil(method, path, reqPayload, hostname)
      .then(response => {
        console.log("*************** success response ***************");
        console.log("forwarded path", hostname + path);
        console.log("response body", response);

        res.locals.customResponse = response;
        next();
      })
      .catch(err => {
        console.log("************* error has occurred **********************");
        console.log("forwarded path", hostname + path);
        console.log("status code", err.status);
        console.log("error response body", err.response.body);

        res.locals.customResponse = err.response.body;
        res.locals.headers = { status: err.status };

        next();
      });
  } else {
    next();
  }
};

module.exports = {
  callRouteAction,
  forwardRequest
};
