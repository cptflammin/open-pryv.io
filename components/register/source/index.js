/**
 * @license
 * Copyright (c) 2020 Pryv S.A. https://pryv.com
 * 
 * This file is part of Open-Pryv.io and released under BSD-Clause-3 License
 * 
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, 
 *    this list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice, 
 *    this list of conditions and the following disclaimer in the documentation 
 *    and/or other materials provided with the distribution.
 * 
 * 3. Neither the name of the copyright holder nor the names of its contributors 
 *    may be used to endorse or promote products derived from this software 
 *    without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE 
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL 
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER 
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, 
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * SPDX-License-Identifier: BSD-3-Clause
 * 
 */
var logger = require('winston');
var database = require('./storage/database');
var config = require('./config');
var messages = require('./utils/messages');
logger['default'].transports.console.level = 'info';

const headPath = require('components/api-server/src/routes/Paths').Register;

class mockExpress {
  constructor(expressApp) {
    this.app = expressApp; 
  }

  use(fn) {
    this.app.use(fn);
  }

  get(path, cb1, cb2) {
    if (cb2) {
      return this.app.get(headPath + path, cb1, cb2);
    }
    this.app.get(headPath + path, cb1);
  }

  post(path, cb1, cb2) {
    if (cb2) {
      return this.app.post(headPath + path, cb1, cb2);
    }
    this.app.post(headPath + path, cb1);
  }
}

module.exports = async (expressApp, application) => {
  config.loadSettings(application.settings);
  database.setReference('storage', application.storageLayer);
  database.setReference('systemAPI', application.systemAPI);
  
  const app = new mockExpress(expressApp);
  // public API routes
  require('./routes/email')(app);
  require('./routes/service')(app);
  require('./routes/users')(app);
  require('./routes/access')(app);
  require('./routes/admin')(app);
  require('./routes/server')(app); // only used for backwards compatiblity with DNS set-up
  require('./middleware/app-errors')(app);

  // register all reg routes
  expressApp.all(headPath + '/*', function (req, res, next) {
    res.status(404).send({ id: 'unkown-route', message: 'Unknown route: ' + req.path });
  });
}