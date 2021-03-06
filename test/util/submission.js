import SubmissionList from '../../src/components/submission/list.vue';

import testData from '../data';
import { mockHttp } from './http';

// eslint-disable-next-line import/prefer-default-export
export const loadSubmissionList = (mountOptions = {}) => {
  const project = testData.extendedProjects.last();
  const form = testData.extendedForms.last();
  const { propsData } = mountOptions;
  const top = propsData != null && propsData.top != null
    ? propsData.top
    : SubmissionList.props.top.default;
  return mockHttp()
    .mount(SubmissionList, {
      ...mountOptions,
      propsData: {
        projectId: project.id.toString(),
        xmlFormId: form.xmlFormId,
        draft: form.publishedAt == null,
        top,
        ...propsData
      },
      requestData: {
        project,
        form,
        formDraft: form.publishedAt == null
          ? testData.extendedFormDrafts.last()
          : { problem: 404.1 },
        keys: testData.standardKeys.sorted(),
        ...mountOptions.requestData
      },
      router: true
    })
    .respondWithData(() => form._fields)
    .respondWithData(() => testData.submissionOData(top(0)))
    .modify(series => {
      if (form.publishedAt == null) return series;
      return series.respondWithData(() => testData.extendedFieldKeys
        .sorted()
        .sort((fieldKey1, fieldKey2) =>
          fieldKey1.displayName.localeCompare(fieldKey2.displayName))
        .map(testData.toActor));
    });
};
