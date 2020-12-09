self.addEventListener('message', ({ data }) => {
	if (! (data.file instanceof File)) {
		throw new Error('No file give');
	} else {
		const reader = new FileReader();
		reader.addEventListener('load', ({ target: { result }}) => self.postMessage({
			dataUri: result,
			objectUrl: URL.createObjectURL(data.file),
		}));
		reader.readAsDataURL(data.file);
	}
});
