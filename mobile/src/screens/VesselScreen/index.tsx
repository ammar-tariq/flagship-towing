import {images} from '@Assets/Images';
import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Image, ListRenderItem, View} from 'react-native';
import {styles} from './styles';
import Row from '@Components/Row';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import {ActionSheet} from '@Components/Sheet';
import {font} from '@Utils/helpers';
import {navigate} from '@Utils/navigation';
import {DialogBox} from '@Components/DialogBox';
import useVessel from '@Hooks/useVessel';
import {useAuthMode} from '@Hooks/useAuthMode';
import Button from '@Components/Button';
import CachedImage, {preloadImages} from '@Components/CachedImage';
import {colors} from '@Utils/color';

const RenderRow = memo(({label, value}: {label: string; value: string}) => (
  <Row justify="space-between" align="flex-start">
    <AppText weight="bold" style={styles.label_text}>
      {label}
    </AppText>
    <View style={styles.value_wrap}>
      <AppText weight="bold" style={styles.value_text}>
        {value}
      </AppText>
    </View>
  </Row>
));

type VesselItemProps = {
  item: any;
  onOpenActions: (item: any) => void;
  formatVesselData: (data: any) => {
    vesselOwner: {title: string; value: string}[];
    vessel: {title: string; value: string}[];
  };
};

const VesselListItem = memo(
  ({item, onOpenActions, formatVesselData}: VesselItemProps) => {
    const {vesselOwner, vessel} = formatVesselData(item);
    const imageUri = item?.images?.[0];
    const ownerName =
      [item?.first_name, item?.last_name].filter(Boolean).join(' ') || 'Vessel';

    return (
      <View style={styles.card}>
        {imageUri ? (
          <CachedImage source={imageUri} style={styles.image_style} />
        ) : (
          <View style={styles.image_placeholder}>
            <Image source={images.icons.vessel} style={styles.image_placeholder_icon} />
          </View>
        )}

        <View style={styles.card_body}>
          <Row justify="space-between" align="center" style={styles.owner_header}>
            <View style={styles.card_title_wrap}>
              <AppText weight="semibold" style={[styles.card_title, {fontSize: font(17)}]}>
                {ownerName}
              </AppText>
              <AppText weight="medium" style={styles.card_subtitle}>
                Vessel Owner Information
              </AppText>
            </View>
            <PressableScale
              variant="icon"
              onPress={() => onOpenActions(item)}
              style={styles.menu_btn}
              accessibilityRole="button"
              accessibilityLabel="Vessel options">
              <Image source={images.icons.menu} style={styles.menu_icon} />
            </PressableScale>
          </Row>

          {vesselOwner.map((row, index) => (
            <RenderRow
              key={`owner-${index}`}
              label={row.title}
              value={row.value}
            />
          ))}

          <View style={styles.section_divider} />

          <AppText
            weight="semibold"
            style={[styles.section_header, {fontSize: font(16)}]}>
            Vessel Information
          </AppText>
          {vessel.map((row, index) => (
            <RenderRow
              key={`vessel-${index}`}
              label={row.title}
              value={row.value}
            />
          ))}
        </View>
      </View>
    );
  },
);

const VesselListFooter = memo(
  ({
    hasData,
    onAddVessel,
  }: {
    hasData: boolean;
    onAddVessel: () => void;
  }) => {
    if (!hasData) {
      return null;
    }

    return (
      <View style={styles.footerContainer}>
        <Button
          text="Add Vessel"
          onPress={onAddVessel}
          style={styles.footerButton}
        />
      </View>
    );
  },
);

const VesselListEmpty = memo(({onAddVessel}: {onAddVessel: () => void}) => (
  <View style={styles.emptyContainer}>
    <PressableScale
      variant="soft"
      onPress={onAddVessel}
      style={styles.emptyAddButton}>
      <View style={styles.emptyAddBox}>
        <Image source={images.icons.plus} style={styles.emptyAddIcon} />
      </View>
      <AppText weight="semibold" style={{fontSize: font(16)}}>
        Add Vessel
      </AppText>
    </PressableScale>
  </View>
));

const VesselScreen = () => {
  const {values, functions} = useVessel();
  const {requireAuth} = useAuthMode();
  const [actionItem, setActionItem] = useState<any>(null);

  useEffect(() => {
    const list = values?.data;
    if (Array.isArray(list)) {
      preloadImages(list.map((item: any) => item?.images?.[0]));
    }
  }, [values?.data]);

  const handleAddVessel = useCallback(() => {
    requireAuth(() => navigate('Memberships'));
  }, [requireAuth]);

  const handleDeleteRequest = useCallback(
    (id: string) => {
      functions.setDeleteId(id);
      functions.toggleModal();
    },
    [functions],
  );

  const closeActions = useCallback(() => setActionItem(null), []);

  const hasPhoto = Boolean(actionItem?.images?.[0]);

  const actionSheetActions = useMemo(
    () => [
      {
        label: hasPhoto ? 'Update Photo' : 'Add Photo',
        icon: images.icons.camera,
        onPress: () => {
          closeActions();
          functions.openPhotoPicker(actionItem);
        },
      },
      {
        label: 'Edit Details',
        icon: images.icons.edit,
        onPress: () => functions.handleEdit(),
      },
      {
        label: 'Delete',
        icon: images.icons.trash,
        danger: true,
        onPress: () => {
          if (actionItem?._id) {
            handleDeleteRequest(actionItem._id);
          }
        },
      },
    ],
    [actionItem, functions, handleDeleteRequest, hasPhoto],
  );

  const photoSheetActions = useMemo(
    () => [
      {
        label: 'Take Photo',
        icon: images.icons.camera,
        onPress: () => functions.openCamera(),
      },
      {
        label: 'Choose from Gallery',
        icon: images.icons.gallery,
        onPress: () => functions.openGallery(),
      },
    ],
    [functions],
  );

  const renderItem: ListRenderItem<any> = useCallback(
    ({item}) => (
      <VesselListItem
        item={item}
        onOpenActions={setActionItem}
        formatVesselData={functions.formatVesselData}
      />
    ),
    [functions.formatVesselData],
  );

  const keyExtractor = useCallback((item: {_id: string}) => item._id, []);

  const listHeader = useMemo(
    () => (
      <>
        <DialogBox
          status="correct"
          onClose={functions.toggleVisible}
          visible={values.visible}
          subheading="Contact Support To Edit The Vessel"
          button={[{text: 'Ok', onPress: functions.handleYes}]}
        />
        <DialogBox
          status="correct"
          onClose={functions.toggleModal}
          visible={values.modal}
          subheading="Do you really want to delete this vessel? Deleting this vessel will also end all membership auto renew functionality for this vessel."
          button={[
            {
              text: 'Delete',
              onPress: functions.handleDelete,
              isLoading: values.deleteLoading,
            },
            {text: 'Cancel', onPress: functions.toggleModal},
          ]}
        />
        <ActionSheet
          visible={Boolean(actionItem)}
          onClose={closeActions}
          title="Vessel options"
          subtitle="Choose an action"
          icon={images.icons.vessel}
          actions={actionSheetActions}
        />
        <ActionSheet
          visible={values.photoSheet}
          onClose={functions.togglePhotoSheet}
          title={values.photoHasExisting ? 'Update Photo' : 'Add Photo'}
          subtitle="Choose a source"
          icon={images.icons.camera}
          actions={photoSheetActions}
        />
        {values.photoUploading ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.55)',
            }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText weight="medium" style={{marginTop: 12}}>
              Saving photo…
            </AppText>
          </View>
        ) : null}
      </>
    ),
    [
      actionItem,
      actionSheetActions,
      closeActions,
      functions.handleDelete,
      functions.handleYes,
      functions.toggleModal,
      functions.togglePhotoSheet,
      functions.toggleVisible,
      hasPhoto,
      photoSheetActions,
      values.deleteLoading,
      values.modal,
      values.photoHasExisting,
      values.photoSheet,
      values.photoUploading,
      values.visible,
    ],
  );

  const hasData = Boolean(values.data && values.data.length > 0);

  return (
    <View style={styles.main_style}>
      <FlatList
        refreshing={values.isLoading}
        onRefresh={functions.handleRefetch}
        data={values.data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.list_content}
        ListFooterComponent={
          <VesselListFooter hasData={hasData} onAddVessel={handleAddVessel} />
        }
        ListEmptyComponent={<VesselListEmpty onAddVessel={handleAddVessel} />}
        removeClippedSubviews
        maxToRenderPerBatch={6}
        windowSize={7}
      />
    </View>
  );
};

export default VesselScreen;
