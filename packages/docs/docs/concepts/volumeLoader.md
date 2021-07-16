---
id: volumeLoader
title: Volume Loaders
---


# (New) Volume Loaders

We have added [`Cornerstone-image-loader-streaming-volume`](/docs/cornerstone-image-loader-streaming-volume) library to support streaming in the images of
a volume progressively into the GPU.

## Register Volume Loaders
You can use [`registerVolumeLoader`](/docs/cornerstone-render#registervolumeloader) to define a volume loader which should be called on a particular `scheme`.
Below you can see a simplified code for our `cornerstoneStreamingImageVolumeLoader` in which:

1. Based a set of imageIds, we compute volume metadata such as: spacing, origin, direction, etc.
2. Instantiate a new [`StreamingImageVolume`](/docs/cornerstone-image-loader-streaming-volume/classes/StreamingImageVolume)
   - StreamingImageVolume implements methods for loading, cancelLoading
   - It implements load via using `requestPoolManager`
   - Each loaded frame is put at the correct slice in the 3D volume

3. Return a `Volume Load Object` which has a promise that resolves to the streamed volume.


```js
function cornerstoneStreamingImageVolumeLoader(
  volumeId: string,
  options: {
    imageIds: Array<string>
  }
){
  /** ... **/

  // Compute Volume metadata based on imageIds
  const volumeMetadata = makeVolumeMetadata(imageIds)

  /** ... **/

  const streamingImageVolume = new StreamingImageVolume(
    // ImageVolume properties
    {
      uid: volumeId,
      metadata: volumeMetadata,
      dimensions,
      spacing,
      origin,
      direction,
      scalarData,
      sizeInBytes,
    },
    // Streaming properties
    {
      imageIds: sortedImageIds,
      loadStatus: {
        loaded: false,
        loading: false,
        cachedFrames: [],
        callbacks: [],
      },
    }
  )


  return {
    promise: Promise.resolve(streamingImageVolume),
    cancel: () => {
      streamingImageVolume.cancelLoading()
    },
  }
}


registerVolumeLoader('cornerstoneStreamingImageVolume', cornerstoneStreamingImageVolumeLoader)

// Used for any volume that its scheme is not provided
registerUnknownVolumeLoader(cornerstoneStreamingImageVolumeLoader)
```