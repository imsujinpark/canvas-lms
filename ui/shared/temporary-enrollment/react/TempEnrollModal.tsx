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

import React, {
  cloneElement,
  MouseEvent,
  MouseEventHandler,
  ReactElement,
  useEffect,
  useState,
} from 'react'
import {useScope as useI18nScope} from '@canvas/i18n'
import {Modal} from '@instructure/ui-modal'
import {Button} from '@instructure/ui-buttons'
import {Heading} from '@instructure/ui-heading'
import {TempEnrollSearch} from './TempEnrollSearch'
import {TempEnrollEdit} from './TempEnrollEdit'
import {TempEnrollAssign} from './TempEnrollAssign'
import {Flex} from '@instructure/ui-flex'
import {
  Enrollment,
  EnrollmentType,
  MODULE_NAME,
  RECIPIENT,
  Role,
  TempEnrollPermissions,
  User,
} from './types'
import {showFlashSuccess} from '@canvas/alerts/react/FlashAlert'
import {createAnalyticPropsGenerator} from './util/analytics'
import {Spinner} from '@instructure/ui-spinner'
import {fetchTemporaryEnrollments} from './api/enrollment'
import {Alert} from '@instructure/ui-alerts'

const I18n = useI18nScope('temporary_enrollment')

// initialize analytics props
const analyticProps = createAnalyticPropsGenerator(MODULE_NAME)

interface Props {
  readonly title: string | ((enrollmentType: EnrollmentType, name: string) => string)
  readonly enrollmentType: EnrollmentType
  readonly children: ReactElement
  readonly user: User
  readonly canReadSIS?: boolean
  readonly permissions: {
    readonly teacher: boolean
    readonly ta: boolean
    readonly student: boolean
    readonly observer: boolean
    readonly designer: boolean
  }
  readonly accountId: string
  readonly roles: Role[]
  readonly defaultOpen?: boolean
  readonly tempEnrollments?: Enrollment[]
  readonly isEditMode: boolean
  readonly onToggleEditMode?: (mode?: boolean) => void
  // TODO add onDeleteEnrollment prop to parent component and update user list
  readonly onDeleteEnrollment?: (enrollmentId: number) => void
  readonly tempEnrollPermissions: TempEnrollPermissions
}

export function TempEnrollModal(props: Props) {
  const [open, setOpen] = useState(props.defaultOpen || false)
  const [page, setPage] = useState(0)
  const [enrollment, setEnrollment] = useState<User | null>(null)
  const [enrollmentData, setEnrollmentData] = useState<Enrollment[]>([])
  const [isFetchEnrollmentDataComplete, setIsFetchEnrollmentDataComplete] = useState(false)
  const [isViewingAssignFromEdit, setIsViewingAssignFromEdit] = useState(false)
  const [buttonsDisabled, setButtonsDisabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isModalOpenAnimationComplete, setIsModalOpenAnimationComplete] = useState(false)

  useEffect(() => {
    if (isFetchEnrollmentDataComplete && isModalOpenAnimationComplete) {
      setLoading(false)
      setButtonsDisabled(false)
    }
  }, [isFetchEnrollmentDataComplete, isModalOpenAnimationComplete])

  const fetchAndSetEnrollments = async (userId: string, isRecipient: boolean) => {
    try {
      const fetchedEnrollments = await fetchTemporaryEnrollments(userId, isRecipient)
      setEnrollmentData(fetchedEnrollments)
    } catch (error) {
      setErrorMessage('An unexpected error occurred, please try again later.')
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch enrollments for user ${userId}:`, error)
    }
  }

  const dynamicTitle =
    typeof props.title === 'function'
      ? props.title(props.enrollmentType, props.user.name)
      : props.title

  const resetCommonState = () => {
    if (props.isEditMode && props.onToggleEditMode) {
      props.onToggleEditMode(false)
    }

    if (props.tempEnrollments) {
      setEnrollmentData(props.tempEnrollments)
    }
  }

  const handleModalReset = () => {
    setPage(0)
    setEnrollment(null)
    setIsViewingAssignFromEdit(false)
    setIsFetchEnrollmentDataComplete(false)
    setIsModalOpenAnimationComplete(false)
    resetCommonState()
  }

  const handleGoToAssignPageWithEnrollment = (enrollmentUser: User) => {
    setEnrollment(enrollmentUser)
    setPage(2)
    setIsViewingAssignFromEdit(true)
    resetCommonState()
  }

  const handleEnrollmentSubmission = (isSuccess: boolean) => {
    if (isSuccess) {
      setOpen(false)
      showFlashSuccess(I18n.t('Temporary enrollment was successfully created.'))()
    } else {
      setPage(2)
    }
  }

  const handleEnrollmentDeletion = (enrollmentId: number) => {
    // remove/update enrollment from internal state
    setEnrollmentData(prevData => prevData.filter(item => item.id !== enrollmentId))
    if (props.onDeleteEnrollment) {
      props.onDeleteEnrollment(enrollmentId)
    }
  }

  const handleOpenModal = () => {
    if (!open) {
      setOpen(true)
    }
  }

  const handleCloseModal = () => {
    if (open) {
      setOpen(false)
    }
  }

  const handleSetEnrollmentFromSearch = (enrollmentUser: User) => {
    setEnrollment(enrollmentUser)
  }

  const handleGoBackward = () => {
    setPage((currentPage: number) => currentPage - 1)
  }

  const handleGoForward = () => {
    setPage(currentPage => currentPage + 1)
  }

  const isSubmissionPage = () => {
    return page === 3
  }

  const handleModalEntered = () => {
    setIsModalOpenAnimationComplete(true)
  }

  const handleModalEnter = async () => {
    setLoading(true)
    setButtonsDisabled(true)

    if (!props.user || !props.isEditMode) {
      setIsFetchEnrollmentDataComplete(true)
      return
    }

    const isRecipientEnrollment = props.enrollmentType === RECIPIENT
    await fetchAndSetEnrollments(props.user.id, isRecipientEnrollment)
    setIsFetchEnrollmentDataComplete(true)
  }

  const handleModalExit = () => {
    setButtonsDisabled(true)
    setLoading(true)
  }

  const handleChildClick =
    (originalOnClick?: MouseEventHandler<HTMLElement>) => (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      handleOpenModal()
      // call the original onClick (if it exists)
      if (typeof originalOnClick === 'function') {
        originalOnClick(event)
      }
    }

  const renderBody = () => {
    if (props.isEditMode) {
      return (
        <TempEnrollEdit
          user={props.user}
          enrollments={enrollmentData}
          onAddNew={handleModalReset}
          onEdit={handleGoToAssignPageWithEnrollment}
          onDelete={handleEnrollmentDeletion}
          enrollmentType={props.enrollmentType}
          tempEnrollPermissions={props.tempEnrollPermissions}
        />
      )
    } else {
      if (page >= 2) {
        return (
          <TempEnrollAssign
            user={props.user}
            enrollment={enrollment}
            roles={props.roles}
            goBack={handleGoBackward}
            permissions={props.permissions}
            doSubmit={isSubmissionPage}
            setEnrollmentStatus={handleEnrollmentSubmission}
            isInAssignEditMode={isViewingAssignFromEdit}
            enrollmentType={props.enrollmentType}
          />
        )
      }

      return (
        <TempEnrollSearch
          accountId={props.accountId}
          canReadSIS={props.canReadSIS}
          user={props.user}
          page={page}
          searchFail={handleModalReset}
          searchSuccess={handleSetEnrollmentFromSearch}
          foundEnroll={enrollment}
        />
      )
    }
  }

  const renderButtons = () => {
    if (props.isEditMode) {
      return (
        <Flex.Item margin="0 small 0 0">
          <Button disabled={buttonsDisabled} onClick={handleCloseModal} {...analyticProps('Done')}>
            {I18n.t('Done')}
          </Button>
        </Flex.Item>
      )
    } else {
      return [
        <Flex.Item key="cancel" margin="0 small 0 0">
          <Button
            disabled={buttonsDisabled}
            onClick={handleCloseModal}
            {...analyticProps('Cancel')}
          >
            {I18n.t('Cancel')}
          </Button>
        </Flex.Item>,

        page === 1 && (
          <Flex.Item key="startOver" margin="0 small 0 0">
            <Button
              disabled={buttonsDisabled}
              onClick={handleModalReset}
              {...analyticProps('StartOver')}
            >
              {I18n.t('Start Over')}
            </Button>
          </Flex.Item>
        ),

        !props.isEditMode && (
          <Flex.Item key="nextOrSubmit" margin="0 small 0 0">
            <Button
              disabled={buttonsDisabled}
              color="primary"
              onClick={handleGoForward}
              {...analyticProps(page === 2 ? 'Submit' : 'Next')}
            >
              {page === 2 ? I18n.t('Submit') : I18n.t('Next')}
            </Button>
          </Flex.Item>
        ),
      ]
    }
  }

  const renderLoader = () => {
    return (
      <Flex justifyItems="center" alignItems="center">
        <Spinner renderTitle={I18n.t('Loading')} />
      </Flex>
    )
  }

  const renderError = () => {
    return (
      <Alert variant="error" margin="0">
        {errorMessage}
      </Alert>
    )
  }

  return (
    <>
      <Modal
        overflow="scroll"
        open={open}
        size="large"
        label={I18n.t('Create a Temporary Enrollment')}
        shouldCloseOnDocumentClick={true}
        themeOverride={{smallMaxWidth: '30em'}}
        onEnter={handleModalEnter}
        onEntered={handleModalEntered}
        onExit={handleModalExit}
        onDismiss={handleCloseModal}
        onExited={handleModalReset}
      >
        <Modal.Header>
          <Heading tabIndex={-1} level="h2">
            {dynamicTitle}
          </Heading>
        </Modal.Header>

        <Modal.Body>
          {errorMessage ? renderError() : loading ? renderLoader() : renderBody()}
        </Modal.Body>

        <Modal.Footer>
          <Flex>{renderButtons()}</Flex>
        </Modal.Footer>
      </Modal>

      {cloneElement(props.children, {
        onClick: handleChildClick(props.children.props.onClick),
      })}
    </>
  )
}
