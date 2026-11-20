import {heightPixel} from '@Utils/helpers';
import React, {FC, memo, ReactNode} from 'react';
import {FlexAlignType, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';

export type RowProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  align?: FlexAlignType;
};

const Row: FC<RowProps> = ({
  style,
  children,
  justify = 'flex-start',
  align = 'center',
}) => {
  return (
    <View
      style={[
        styles.main_style,
        style,
        {justifyContent: justify, alignItems: align},
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  main_style: {
    flexDirection: 'row',
    marginVertical: heightPixel(5),
  },
});

export default memo(Row);
