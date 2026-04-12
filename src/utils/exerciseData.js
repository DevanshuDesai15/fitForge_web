export const extractExerciseDataArray = (rawData) => {
  if (Array.isArray(rawData?.products)) {
    return rawData.products;
  }

  if (Array.isArray(rawData)) {
    if (rawData.every((item) => Array.isArray(item?.data))) {
      return rawData.flatMap((item) => item.data);
    }

    return rawData;
  }

  if (Array.isArray(rawData?.data)) {
    return rawData.data;
  }

  return [];
};
