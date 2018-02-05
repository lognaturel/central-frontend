/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import moment from 'moment';

import { logIn, resetAuth } from '../lib/auth';

export { resetAuth };

export function mockSession() {
  const token = 'a'.repeat(64);
  const tomorrow = moment(new Date()).add(1, 'days').utc().format();
  return { token, expiresAt: tomorrow };
}

export function mockUser() {
  return { email: 'test@opendatakit.org' };
}

export function mockLogin() {
  logIn(mockSession(), mockUser());
}
