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
import {render, waitFor} from '@testing-library/react'
import {TempEnrollSearch} from '../TempEnrollSearch'
import fetchMock from 'fetch-mock'
import {User} from '../types'

describe('TempEnrollSearch', () => {
  const props = {
    user: {
      name: 'user1',
      id: '1',
    } as User,
    accountId: '1',
    searchFail: jest.fn(),
    searchSuccess: jest.fn(),
    canReadSIS: true,
  }
  const userTemplate = {
    user_name: '',
    account_name: '',
    account_id: '',
  }
  const mockSame = {users: [{userTemplate, user_id: '1', address: ''}]}
  const mockNoUser = {users: []}
  const mockFindUser = {
    users: [
      {
        userTemplate,
        user_id: '2',
        email: 'user@email.com',
        sis_user_id: 'user_sis',
        login_id: 'user_login',
      },
    ],
  }

  afterEach(() => {
    fetchMock.restore()
  })

  it('shows search page', () => {
    const {getByText} = render(<TempEnrollSearch page={0} {...props} />)
    expect(getByText('Find a recipient of temporary enrollments from user1')).toBeInTheDocument()
  })

  it('displays error message when API call fails', async () => {
    fetchMock.post(`/accounts/1/user_lists.json?user_list=&v2=true&search_type=cc_path`, () => {
      throw Object.assign(new Error('error'), {code: 402})
    })
    const {queryAllByText} = render(<TempEnrollSearch page={1} {...props} />)
    await waitFor(() => expect(queryAllByText('error')).toBeTruthy())
  })

  it('displays error message when user is same as original user', async () => {
    fetchMock.post(`/accounts/1/user_lists.json?user_list=&v2=true&search_type=cc_path`, mockSame)
    fetchMock.get('/api/v1/users/1', {})
    const {queryAllByText} = render(<TempEnrollSearch page={1} {...props} />)
    await waitFor(() =>
      expect(
        queryAllByText(
          'The user found matches the source user. Please search for a different user.'
        )
      ).toBeTruthy()
    )
  })

  it('displays error message when no user is returned', async () => {
    fetchMock.post(`/accounts/1/user_lists.json?user_list=&v2=true&search_type=cc_path`, mockNoUser)
    const {queryAllByText} = render(<TempEnrollSearch page={1} {...props} />)
    await waitFor(() => expect(queryAllByText('User could not be found.')).toBeTruthy())
  })

  it('displays new page when user is found', async () => {
    fetchMock.post(
      `/accounts/1/user_lists.json?user_list=&v2=true&search_type=cc_path`,
      mockFindUser
    )
    fetchMock.get('/api/v1/users/2', {})
    const {queryByText} = render(<TempEnrollSearch page={1} {...props} />)
    await waitFor(() =>
      expect(queryByText(/is ready to be assigned temporary enrollments/)).toBeTruthy()
    )
  })

  it('changes label when different search type is chosen', () => {
    const {getAllByText, getByText} = render(<TempEnrollSearch page={0} {...props} />)
    expect(
      getByText('Enter the email address of the user you would like to temporarily enroll')
    ).toBeInTheDocument()

    const sis = getAllByText('SIS ID')[0]
    sis.click()
    expect(
      getByText('Enter the SIS ID of the user you would like to temporarily enroll')
    ).toBeInTheDocument()

    const login = getAllByText('Login ID')[0]
    login.click()
    expect(
      getByText('Enter the login ID of the user you would like to temporarily enroll')
    ).toBeInTheDocument()
  })

  it('hides SIS search when user does not have permission', () => {
    const {queryByText} = render(<TempEnrollSearch page={0} {...props} canReadSIS={false} />)
    expect(queryByText('SIS ID')).toBeFalsy()
  })

  it('shows found user information on confirmation page', async () => {
    fetchMock.post(
      `/accounts/1/user_lists.json?user_list=&v2=true&search_type=cc_path`,
      mockFindUser
    )
    fetchMock.get('/api/v1/users/2', mockFindUser.users[0])
    const {queryByText} = render(<TempEnrollSearch page={1} {...props} />)
    await waitFor(() => expect(queryByText('user@email.com')).toBeInTheDocument())
    await waitFor(() => expect(queryByText('user_sis')).toBeInTheDocument())
    await waitFor(() => expect(queryByText('user_login')).toBeInTheDocument())
  })

  it('does not show sis id on confirmation page when permission is off', async () => {
    fetchMock.post(
      `/accounts/1/user_lists.json?user_list=&v2=true&search_type=cc_path`,
      mockFindUser
    )
    fetchMock.get('/api/v1/users/2', mockFindUser.users[0])
    const {queryByText} = render(<TempEnrollSearch page={1} {...props} canReadSIS={false} />)
    await waitFor(() => expect(queryByText('SIS ID')).toBeFalsy())
  })
})
