import React, {memo} from 'react';
import {FlatList, FlatListProps, StyleSheet} from 'react-native';

export type AppFlatListProps<T> = FlatListProps<T>;

function AppFlatListInner<T>(
  {
    style,
    contentContainerStyle,
    showsVerticalScrollIndicator = false,
    ...rest
  }: AppFlatListProps<T>,
  ref: React.Ref<FlatList<T>>,
) {
  return (
    <FlatList
      ref={ref}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      {...rest}
      style={[styles.flex, style]}
      contentContainerStyle={contentContainerStyle}
    />
  );
}

const AppFlatList = memo(React.forwardRef(AppFlatListInner)) as <T>(
  props: AppFlatListProps<T> & {ref?: React.Ref<FlatList<T>>},
) => React.ReactElement;

const styles = StyleSheet.create({
  flex: {flex: 1},
});

export default AppFlatList;
