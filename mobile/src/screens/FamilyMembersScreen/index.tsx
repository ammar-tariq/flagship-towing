import AppText from '@Components/AppText';
import AppWrapper from '@Components/Wrapper/AppWrapper';
import React, {memo, useCallback, useMemo, useState} from 'react';
import {styles} from './styles';
import Row from '@Components/Row';
import {FlatList, Image, ListRenderItem, View} from 'react-native';
import Button from '@Components/Button';
import {images} from '@Assets/Images';
import {navigate} from '@Utils/navigation';
import {getApiErrorMessage, showGeneralError} from '@Utils/formErrors';
import {ActionSheet} from '@Components/Sheet';
import {DialogBox} from '@Components/DialogBox';
import PressableScale from '@Components/PressableScale';
import {
  useDeleteFamilyMutation,
  useGetFamilyQuery,
} from '@Api/user';
import {Loader} from '@Components/Loader';
import {EmptyComponent} from '@Components/EmptyComponent';
import {font} from '@Utils/helpers';
import {formatPhoneDisplay} from '@Utils/countries';

type FamilyMember = {
  _id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  relation?: string;
  status?: string;
};

type FamilyListItemProps = {
  item: FamilyMember;
  onOpenActions: (item: FamilyMember) => void;
};

const InfoRow = memo(({label, value}: {label: string; value: string}) => (
  <Row justify="space-between" align="flex-start" style={styles.row}>
    <AppText weight="medium" style={styles.label_text}>
      {label}
    </AppText>
    <View style={styles.value_wrap}>
      <AppText weight="semibold" style={styles.value_text}>
        {value || '—'}
      </AppText>
    </View>
  </Row>
));

const statusMeta = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') {
    return {
      label: 'Pending review',
      pill: styles.status_pill_pending,
      text: styles.status_text_pending,
    };
  }
  if (normalized === 'rejected') {
    return {
      label: 'Rejected',
      pill: undefined,
      text: undefined,
    };
  }
  return {
    label: 'Active',
    pill: styles.status_pill_active,
    text: styles.status_text_active,
  };
};

const FamilyMemberItem = memo(({item, onOpenActions}: FamilyListItemProps) => {
  const name =
    [item?.first_name, item?.last_name].filter(Boolean).join(' ').trim() ||
    'Authorized user';
  const status = statusMeta(item?.status);
  const phone = item?.phone ? formatPhoneDisplay(item.phone) : '—';

  return (
    <View style={styles.card}>
      <Row justify="space-between" align="flex-start" style={styles.card_header}>
        <View style={styles.card_title_wrap}>
          <AppText
            weight="semibold"
            style={[styles.card_title, {fontSize: font(17)}]}
            numberOfLines={2}>
            {name}
          </AppText>
          <AppText weight="medium" style={styles.card_subtitle}>
            {item?.relation?.trim() || 'Authorized user'}
          </AppText>
          <View style={[styles.status_pill, status.pill]}>
            <AppText
              weight="semibold"
              style={[styles.status_text, status.text]}>
              {status.label}
            </AppText>
          </View>
        </View>
        <PressableScale
          variant="icon"
          onPress={() => onOpenActions(item)}
          style={styles.menu_btn}
          accessibilityRole="button"
          accessibilityLabel="Authorized user options">
          <Image source={images.icons.menu} style={styles.menu_icon} />
        </PressableScale>
      </Row>

      <InfoRow label="Email" value={item?.email?.trim() || '—'} />
      <InfoRow label="Phone" value={phone} />
      <InfoRow label="Relationship" value={item?.relation?.trim() || '—'} />
    </View>
  );
});

const FamilyMembersScreen = () => {
  const {data, isLoading, refetch} = useGetFamilyQuery();
  const [deleteFamily, {isLoading: isDeleting}] = useDeleteFamilyMutation();
  const [actionItem, setActionItem] = useState<FamilyMember | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FamilyMember | null>(null);

  const familyList: FamilyMember[] = data?.data ?? [];
  const pendingMembers = familyList.filter(item => item?.status === 'pending');
  const approvedMembers = familyList.filter(
    item => item?.status !== 'pending' && item?.status !== 'rejected',
  );
  const nonRejectedCount = familyList.filter(
    item => item?.status !== 'rejected',
  ).length;
  const listData: FamilyMember[] = [
    ...pendingMembers,
    ...approvedMembers.slice(0, 7),
  ];

  const closeActions = useCallback(() => setActionItem(null), []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete?._id) {
      return;
    }
    try {
      await deleteFamily({id: pendingDelete._id}).unwrap();
      setPendingDelete(null);
    } catch (error) {
      showGeneralError(
        getApiErrorMessage(error),
        'Unable to remove authorized user',
      );
    }
  }, [deleteFamily, pendingDelete]);

  const actionSheetActions = useMemo(
    () => [
      {
        label: 'Delete',
        icon: images.icons.trash,
        danger: true,
        onPress: () => {
          if (actionItem) {
            setPendingDelete(actionItem);
          }
        },
      },
    ],
    [actionItem],
  );

  const renderItem: ListRenderItem<FamilyMember> = useCallback(
    ({item}) => (
      <FamilyMemberItem item={item} onOpenActions={setActionItem} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: FamilyMember) => item._id, []);

  const renderFooter = useCallback(() => {
    if (nonRejectedCount >= 7) {
      return null;
    }
    return (
      <View style={styles.footer}>
        <Button
          text="Add Authorized User"
          onPress={() => navigate('AddFamilyMember')}
          style={styles.btn_style}
          text_style={styles.btn_text}
        />
      </View>
    );
  }, [nonRejectedCount]);

  const listHeader = useCallback(
    () => (
      <AppText
        weight="semibold"
        style={[styles.header_style, {fontSize: font(14)}]}>
        A maximum of five (5) immediate family members and a maximum of two (2)
        named operators may be added to the membership record per member
        identification number.
      </AppText>
    ),
    [],
  );

  if (isLoading && listData.length === 0) {
    return <Loader />;
  }

  return (
    <AppWrapper style={styles.screen}>
      <FlatList
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.list_content}
        refreshing={isLoading || isDeleting}
        onRefresh={refetch}
        ListEmptyComponent={() => (
          <EmptyComponent text="No Authorized Users" />
        )}
        showsVerticalScrollIndicator={false}
        data={listData}
        keyExtractor={keyExtractor}
        ListFooterComponent={renderFooter}
        renderItem={renderItem}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={7}
        initialNumToRender={6}
      />

      <ActionSheet
        visible={Boolean(actionItem)}
        onClose={closeActions}
        title="Authorized user"
        subtitle={
          actionItem
            ? `${actionItem.first_name ?? ''} ${actionItem.last_name ?? ''}`.trim()
            : undefined
        }
        icon={images.icons.person}
        actions={actionSheetActions}
      />
      <DialogBox
        status="warning"
        visible={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        heading="Remove authorized user?"
        subheading="This person will no longer be linked to your membership."
        button={[
          {
            text: 'Delete',
            onPress: confirmDelete,
            isLoading: isDeleting,
          },
          {text: 'Cancel', onPress: () => setPendingDelete(null)},
        ]}
      />
    </AppWrapper>
  );
};

export default FamilyMembersScreen;
