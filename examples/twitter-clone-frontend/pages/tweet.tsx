import React, { useState } from 'react';

import {
  ActiveTwitterTagData,
  ActiveTwitterUserData,
  OnQueryChangeParams,
  TwitterUI,
  TwitterUserData,
} from '@remirror/ui-twitter';
import emojiData from 'emoji-mart/data/all.json';
import { startCase, take } from 'lodash';
import { NextFunctionComponent } from 'next';

import { Env } from '@utils/environment';
import matchSorter from 'match-sorter';
import { fakeUsers } from '../firebase/fake-users';

const fakeTags = [
  'Tags',
  'Fake',
  'Help',
  'TypingByHand',
  'DontDoThisAgain',
  'ZoroIsAwesome',
  'ThisIsATagList',
  'NeedsStylingSoon',
  'LondonHits',
  'MCM',
];

const userData: TwitterUserData[] = fakeUsers.results.map(
  (user): TwitterUserData => ({
    avatarUrl: user.picture.thumbnail,
    displayName: startCase(`${user.name.first} ${user.name.last}`),
    uid: user.login.uuid,
    username: user.login.username,
  }),
);

const TweetPage: NextFunctionComponent = () => {
  const [mention, setMention] = useState<OnQueryChangeParams>();

  const onMentionStateChange = (params: OnQueryChangeParams) => {
    setMention(params);
  };

  const userMatches: ActiveTwitterUserData[] =
    mention && mention.type === 'at' && mention.query.length
      ? take(matchSorter(userData, mention.query, { keys: ['username', 'displayName'] }), 6).map(
          (user, index) => ({ ...user, active: index === mention.activeIndex }),
        )
      : [];

  const tagMatches: ActiveTwitterTagData[] =
    mention && mention.type === 'hash' && mention.query.length
      ? take(matchSorter(fakeTags, mention.query), 6).map((tag, index) => ({
          tag,
          active: index === mention.activeIndex,
        }))
      : [];

  return Env.isBrowser ? (
    <TwitterUI
      emojiData={emojiData}
      attributes={{ 'data-test-id': 'ui-twitter' }}
      userData={userMatches}
      tagData={tagMatches}
      onMentionStateChange={onMentionStateChange}
    />
  ) : null;
};

export default TweetPage;
