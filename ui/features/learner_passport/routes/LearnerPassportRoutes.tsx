/*
 * Copyright (C) 2023 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react'
import {Navigate, Route} from 'react-router-dom'

export const LearnerPassportRoutes = (
  <Route path="/users/:userId/passport" lazy={() => import('../pages/LearnerPassportLayout')}>
    <Route path="" element={<Navigate to="achievements" replace={true} />} />
    <Route
      path="achievements"
      lazy={() => import('../pages/Achievements')}
      loader={({params}) => {
        return fetch(`/users/${params.userId}/passport/data/achievements`)
      }}
    />
    <Route path="portfolios" lazy={() => import('../pages/Portfolios')} />
    <Route path="projects" lazy={() => import('../pages/Projects')} />
  </Route>
)
