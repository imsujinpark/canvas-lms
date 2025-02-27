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

import React, {useCallback, useState} from 'react'
import {useLoaderData} from 'react-router-dom'
import {Flex} from '@instructure/ui-flex'
import {Heading} from '@instructure/ui-heading'
import {Text} from '@instructure/ui-text'
import {View} from '@instructure/ui-view'
import AchievementCard from './AchievementCard'
import type {AchievementData} from './types'
import AchievementTray from './AchievementTray'

const AchievementsLayout = () => {
  const achievements = useLoaderData() as AchievementData[]
  const [showingDetails, setShowingDetails] = useState(false)
  const [activeCard, setActiveCard] = useState<AchievementData>()

  const showDetails = useCallback(
    (achievementId: string) => {
      const card = achievements.find(a => a.id === achievementId)
      setActiveCard(card)
      setShowingDetails(card !== undefined)
    },
    [achievements]
  )

  const handleDismissTray = useCallback(() => {
    setShowingDetails(false)
  }, [])

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // @ts-expect-error
      showDetails(e.currentTarget.getAttribute('data-cardid'))
    },
    [showDetails]
  )

  const handleCardKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // @ts-expect-error
        showDetails(e.currentTarget.getAttribute('data-cardid'))
      }
    },
    [showDetails]
  )

  return (
    <div>
      <Heading level="h1" themeOverride={{h1FontWeight: 700}}>
        Achievements
      </Heading>
      <View as="div" margin="small 0">
        <Text size="large">
          View all of the degrees, certificates, badges, and awards you have earned.
        </Text>
      </View>
      <View as="div" margin="large 0 0 0">
        <Text>{achievements.length} achievements</Text>
      </View>
      <Flex as="div" margin="small 0" gap="medium" wrap="wrap">
        {achievements.map((achievement: AchievementData) => (
          <Flex.Item key={achievement.id} shouldShrink={false}>
            <div
              data-cardid={achievement.id}
              role="button"
              tabIndex={0}
              onClick={handleCardClick}
              onKeyDown={handleCardKey}
            >
              <AchievementCard
                isNew={achievement.isNew}
                title={achievement.title}
                issuer={achievement.issuer.name}
                imageUrl={achievement.imageUrl}
              />
            </div>
          </Flex.Item>
        ))}
      </Flex>
      {activeCard && (
        <AchievementTray
          open={showingDetails}
          onDismiss={handleDismissTray}
          activeCard={activeCard}
        />
      )}
    </div>
  )
}

export default AchievementsLayout
