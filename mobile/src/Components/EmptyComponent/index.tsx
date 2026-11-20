import {colors} from '@Utils/color';
import {vh} from '@Utils/helpers';
import React, {FC} from 'react';
import {View} from 'react-native';
import AppText from '@Components/AppText';

interface IEmpty {
  text: string;
}

export const EmptyComponent: FC<IEmpty> = ({text}) => {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <AppText style={{color: colors.primary, fontSize: vh * 2}}>{text}</AppText>
    </View>
  );
};
